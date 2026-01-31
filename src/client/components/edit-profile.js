/* Copyright G. Hemingway, @2025 - All rights reserved */
"use strict";

import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ErrorMessage,
  FormBase,
  FormInput,
  FormLabel,
  FormButton,
  ModalNotify,
} from "./shared.js";

export const EditProfile = ({ currentUser }) => {
  const navigate = useNavigate();
  const { username } = useParams();
  const [state, setState] = useState({
    first_name: "",
    last_name: "",
    city: "",
  });
  const [error, setError] = useState("");
  const [notify, setNotify] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only allow users to edit their own profile
    if (currentUser !== username) {
      navigate(`/profile/${username}`);
      return;
    }

    const fetchUser = async () => {
      try {
        const response = await fetch(`/v1/user/${username}`);
        const data = await response.json();

        if (response.ok) {
          setState({
            first_name: data.first_name || "",
            last_name: data.last_name || "",
            city: data.city || "",
          });
          setLoading(false);
        } else {
          setError(data.error || "Failed to load user");
        }
      } catch (err) {
        setError("Network error. Please try again.");
      }
    };

    fetchUser();
  }, [username, currentUser, navigate]);

  const onChange = (ev) => {
    setError("");
    setState({
      ...state,
      [ev.target.name]: ev.target.value,
    });
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();

    try {
      const res = await fetch("/v1/user", {
        method: "PUT",
        body: JSON.stringify(state),
        credentials: "include",
        headers: {
          "content-type": "application/json",
        },
      });

      if (res.ok) {
        // Refresh user data from server
        const userResponse = await fetch(`/v1/user/${username}`);
        const userData = await userResponse.json();

        // Update localStorage so header and profile refresh
        localStorage.setItem("user", JSON.stringify(userData));

        setNotify("Profile updated successfully!");
      } else {
        const err = await res.json();
        setError(err.error || "Failed to update profile");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
  };

  const onAcceptNotify = () => {
    // Reload the page to update header with new user data
    window.location.href = `/profile/${username}`;
  };

  if (loading) {
    return <div style={{ gridArea: "main", padding: "2em" }}>Loading...</div>;
  }

  return (
    <div style={{ gridArea: "main", padding: "2em" }}>
      {notify !== "" ? (
        <ModalNotify
          id="notification"
          msg={notify}
          onAccept={onAcceptNotify}
        />
      ) : null}
      <h2 style={{ textAlign: "center" }}>Edit Profile</h2>
      <ErrorMessage msg={error} />
      <FormBase>
        <div>
          <FormLabel htmlFor="first_name">First Name:</FormLabel>
          <FormInput
            id="first_name"
            name="first_name"
            placeholder="First Name"
            onChange={onChange}
            value={state.first_name}
          />
        </div>

        <div>
          <FormLabel htmlFor="last_name">Last Name:</FormLabel>
          <FormInput
            id="last_name"
            name="last_name"
            placeholder="Last Name"
            onChange={onChange}
            value={state.last_name}
          />
        </div>

        <div>
          <FormLabel htmlFor="city">City:</FormLabel>
          <FormInput
            id="city"
            name="city"
            placeholder="City"
            onChange={onChange}
            value={state.city}
          />
        </div>

        <FormButton id="submitBtn" onClick={onSubmit}>
          Update Profile
        </FormButton>
        <FormButton
          id="cancelBtn"
          onClick={() => navigate(`/profile/${username}`)}
          style={{ backgroundColor: "#666" }}
        >
          Cancel
        </FormButton>
      </FormBase>
    </div>
  );
};
