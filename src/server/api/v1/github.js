/* Copyright G. Hemingway, @2025 - All rights reserved */
"use strict";

// GitHub OAuth configuration
// REQUIRES environment variables to be set - no fallback values for security
const ghConfig = {
  client_id: process.env.GITHUB_CLIENT_ID,
  client_secret: process.env.GITHUB_CLIENT_SECRET,
  scope: "user:email",
  callback_url: process.env.GITHUB_CALLBACK_URL,
};

// Validate that required environment variables are set
if (!ghConfig.client_id || !ghConfig.client_secret || !ghConfig.callback_url) {
  console.error('ERROR: GitHub OAuth environment variables are not set!');
  console.error('Please set: GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_CALLBACK_URL');
  console.error('See .env.example for details');
}

// Make sure the user came to us first (CSRF protection)
const checkState = async (goodState, state) => {
  if (goodState !== state)
    throw "Invalid state - please try again.";
};

// Exchange temporary GH code for more permanent access_token
const checkCode = async (code, state) => {
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: ghConfig.client_id,
      client_secret: ghConfig.client_secret,
      code,
      state,
    }),
  });
  if (res.ok) return await res.json();
  throw "checkCode error";
};

// Fetch caller's github info
const checkGithubInfo = async (accessToken) => {
  const res = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `token ${accessToken}`,
      "User-Agent": "request",
    },
  });
  if (res.ok) return await res.json();
  throw "checkGithubInfo error";
};

// Fetch caller's email from GitHub
const getGithubEmail = async (accessToken) => {
  const res = await fetch("https://api.github.com/user/emails", {
    headers: {
      Authorization: `token ${accessToken}`,
      "User-Agent": "request",
    },
  });
  if (res.ok) {
    const emails = await res.json();
    // Return the primary email
    const primaryEmail = emails.find(email => email.primary);
    return primaryEmail ? primaryEmail.email : emails[0].email;
  }
  throw "getGithubEmail error";
};

export default (app) => {
  /**
   * Initiate GitHub OAuth flow
   */
  app.get("/v1/auth/github", async (req, res) => {
    // Generate random state for CSRF protection
    req.session.state = Math.random()
      .toString(36)
      .replace(/[^a-z]+/g, "")
      .substr(0, 10);

    const ghPath =
      `https://github.com/login/oauth/authorize?` +
      `scope=${ghConfig.scope}&` +
      `client_id=${ghConfig.client_id}&` +
      `state=${req.session.state}`;

    console.log(`Redirecting to GitHub OAuth: ${ghPath}`);
    res.redirect(ghPath);
  });

  /**
   * Callback when GitHub has authenticated the user
   */
  app.get("/v1/auth/github/callback", async (req, res) => {
    // Must have a temp code from GH
    if (!req.query.code) {
      console.log("GitHub callback: missing code");
      return res.redirect("/register?error=github_auth_failed");
    }

    // Must have state token too
    if (!req.query.state) {
      console.log("GitHub callback: missing state");
      return res.redirect("/register?error=github_auth_failed");
    }

    try {
      // Validate state (CSRF protection)
      await checkState(req.session.state, req.query.state);

      // Convert code to access token
      const { access_token } = await checkCode(req.query.code, req.query.state);

      // Get GitHub user info
      const githubUser = await checkGithubInfo(access_token);
      console.log(`GitHub OAuth: Fetched user ${githubUser.login}`);

      // Get GitHub email
      let primaryEmail;
      try {
        primaryEmail = await getGithubEmail(access_token);
      } catch (err) {
        // Fallback to public email if private
        primaryEmail = githubUser.email || `${githubUser.login}@github.user`;
      }

      // Check if user already exists by GitHub ID
      let user = await app.models.User.findOne({ githubId: githubUser.id.toString() });

      if (!user) {
        // Check if username exists
        let username = githubUser.login.toLowerCase();
        const existingUser = await app.models.User.findOne({ username });

        // If username exists, append github id
        if (existingUser) {
          username = `${githubUser.login.toLowerCase()}_gh${githubUser.id}`;
        }

        // Create new user with a random password (since it won't be used)
        const randomPassword = Math.random().toString(36).slice(-12) + "A1@"; // Meets password requirements

        user = new app.models.User({
          username,
          primary_email: primaryEmail,
          first_name: githubUser.name?.split(" ")[0] || "",
          last_name: githubUser.name?.split(" ").slice(1).join(" ") || "",
          city: githubUser.location || "",
          password: randomPassword, // This sets the hash and salt via the virtual
          githubId: githubUser.id.toString(),
          authProvider: "github",
        });

        try {
          await user.save();
          console.log(`GitHub OAuth: Created new user ${user.username}`);
        } catch (err) {
          console.error("GitHub OAuth: Error creating user", err);
          // If email is also taken, try with a unique email
          if (err.code === 11000 && err.message.indexOf("primary_email") !== -1) {
            user.primary_email = `${githubUser.login.toLowerCase()}_${githubUser.id}@github.user`;
            await user.save();
            console.log(`GitHub OAuth: Created user with modified email ${user.username}`);
          } else {
            throw err;
          }
        }
      } else {
        console.log(`GitHub OAuth: Existing user logged in ${user.username}`);
      }

      // Create session (regenerate for security)
      req.session.regenerate(() => {
        req.session.user = user;
        console.log(`GitHub OAuth success: ${user.username}`);
        // Redirect to GitHub callback page (frontend will handle localStorage)
        res.redirect(`/auth/github/success`);
      });

    } catch (err) {
      console.error("GitHub OAuth error:", err);
      res.redirect("/register?error=github_auth_failed");
    }
  });
};
