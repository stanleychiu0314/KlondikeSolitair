/* Copyright G. Hemingway, @2025 - All rights reserved */
"use strict";

import React from "react";
import styled from "styled-components";

const LandingBase = styled.div`
  grid-area: main;
  background: white;
  min-height: calc(100vh - 60px);
  padding: 0;
  overflow-y: auto;
`;

const HeroSection = styled.div`
  text-align: center;
  padding: 3em 2em 1.5em;
  color: #333;
`;

const Title = styled.h1`
  font-size: 3.5em;
  margin: 0 0 0.3em 0;
  font-weight: 700;
  color: #000;
`;

const Subtitle = styled.p`
  font-size: 1.4em;
  margin: 0;
  color: #000;
  font-weight: 300;
`;

const ContentSection = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 0 2em 3em;
  background: white;
  border-radius: 8px 8px 0 0;
`;


const RulesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2em;
  margin-top: 2em;
`;

const RuleCard = styled.div`
  background: #f8f9fa;
  padding: 0.8em 1.5em 0.8em 1.5em;
  border-radius: 8px;
  border-left: 4px solid #333;
`;

const RuleTitle = styled.h3`
  color: #333
  margin: 0 0 0.8em 0;
  font-size: 1.3em;
`;

const RuleText = styled.p`
  color: #555;
  line-height: 1.6;
  margin: 0;
`;

const ObjectiveSection = styled.div`
  background: #e9ecef;
  color: #333;
  padding: 2em;
  border-radius: 8px;
  margin: 2em 0;
  text-align: center;
`;

const ObjectiveTitle = styled.h3`
  font-size: 1.8em;
  margin: 0 0 0.8em 0;
`;

const ObjectiveText = styled.p`
  font-size: 1.1em;
  line-height: 1.6;
  margin: 0;
`;

const RulesList = styled.div`
  margin-top: 2em;
`;

const RuleItem = styled.div`
  display: flex;
  align-items: flex-start;
  margin-bottom: 1.2em;
`;

const RuleNumber = styled.div`
  background: #333;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  flex-shrink: 0;
  margin-right: 1em;
`;

const RuleContent = styled.div`
  flex: 1;
`;

const RuleItemTitle = styled.h4`
  margin: 0 0 0.3em 0;
  color: #333;
  font-size: 1.1em;
`;

const RuleItemText = styled.p`
  margin: 0;
  color: #666;
  line-height: 1.5;
`;

export const Landing = () => (
  <LandingBase>
    <HeroSection>
      <Title>Welcome to Klondike Solitaire</Title>
      <Subtitle>
        The classic card game you know and love, now online
      </Subtitle>
    </HeroSection>

    <ContentSection>
      <ObjectiveSection>
        <ObjectiveTitle>Game Objective</ObjectiveTitle>
        <ObjectiveText>
          Move all 52 cards to the four foundation stacks, building each suit
          from Ace to King (A-2-3-4-5-6-7-8-9-10-J-Q-K).
        </ObjectiveText>
      </ObjectiveSection>

      <RulesGrid>
        <RuleCard>
          <RuleTitle>The Tableau</RuleTitle>
          <RuleText>
            Seven piles of cards where you can build descending sequences of
            alternating colors (e.g., red 7 on black 8).
          </RuleText>
        </RuleCard>

        <RuleCard>
          <RuleTitle>The Foundation</RuleTitle>
          <RuleText>
            Four stacks at the top where you build up each suit from Ace to
            King. This is your goal!
          </RuleText>
        </RuleCard>

        <RuleCard>
          <RuleTitle>The Draw Pile</RuleTitle>
          <RuleText>
            Click to draw cards when you can't make moves on the tableau. Cards
            go to the discard pile.
          </RuleText>
        </RuleCard>
      </RulesGrid>

      <RulesList>
        <RuleItem>
          <RuleNumber>1</RuleNumber>
          <RuleContent>
            <RuleItemTitle>Moving Cards</RuleItemTitle>
            <RuleItemText>
              On the tableau, place cards in descending order with alternating
              colors. Only Kings can be placed on empty tableau piles.
            </RuleItemText>
          </RuleContent>
        </RuleItem>

        <RuleItem>
          <RuleNumber>2</RuleNumber>
          <RuleContent>
            <RuleItemTitle>Building Foundations</RuleItemTitle>
            <RuleItemText>
              Start each foundation with an Ace, then build up in the same suit
              (Ace, 2, 3, 4... up to King).
            </RuleItemText>
          </RuleContent>
        </RuleItem>

        <RuleItem>
          <RuleNumber>3</RuleNumber>
          <RuleContent>
            <RuleItemTitle>Face-Down Cards</RuleItemTitle>
            <RuleItemText>
              When you move a card from a tableau pile, the card beneath it
              flips face-up and becomes playable.
            </RuleItemText>
          </RuleContent>
        </RuleItem>

        <RuleItem>
          <RuleNumber>4</RuleNumber>
          <RuleContent>
            <RuleItemTitle>Drawing Cards</RuleItemTitle>
            <RuleItemText>
              Click the draw pile to reveal new cards. When the draw pile is
              empty, you can reset it by clicking the empty space.
            </RuleItemText>
          </RuleContent>
        </RuleItem>

        <RuleItem>
          <RuleNumber>5</RuleNumber>
          <RuleContent>
            <RuleItemTitle>Winning the Game</RuleItemTitle>
            <RuleItemText>
              You win when all cards are moved to the foundation stacks. Use
              the Auto Complete button when obvious moves remain!
            </RuleItemText>
          </RuleContent>
        </RuleItem>
      </RulesList>
    </ContentSection>
  </LandingBase>
);
