# ⏳ ChronoMint — Tokenized Time-As-A-Service Marketplace

## 💡 Overview

**ChronoMint** is a decentralized platform that enables users to **tokenize, trade, and verify time-based services** using blockchain, AI, and Chainlink infrastructure. 

Users can mint NFTs that represent their **available time slots**—be it for mentoring, legal consulting, design sessions, or tutoring—and sell, transfer, or resell them in a trustless environment. Payment is automated and conditional, released **only upon AI-verified proof of session delivery**.

This project was developed for the **Chromium Chainlink Hackathon**, with a strong emphasis on **decentralized service marketplaces**, **trustless automation**, and **cross-chain utility**.

---

## 🎯 Problem Statement

Today, service providers face challenges in:

- Monetizing their **time or expertise** in a decentralized, verifiable manner
- Guaranteeing delivery before receiving payment
- Preventing no-shows or disputes without a trusted intermediary

There is no open protocol to represent **availability as a tradable asset**, nor to validate session delivery in an automated, trustless way.

---

## ✅ Solution: ChronoMint

ChronoMint allows anyone to:

- **Mint** their availability into **ERC-721/1155 NFTs**
- **Sell or transfer** those NFTs representing time slots
- **Verify** the session took place using AI + transcript analysis
- **Trigger payment** release using Chainlink Automation & Functions

---

## 🔗 How Chainlink Is Used

| Chainlink Feature      | Role in ChronoMint                                                                 |
|------------------------|-------------------------------------------------------------------------------------|
| **Chainlink Functions**| Pull session transcripts from Zoom, Google Meet via APIs                           |
| **Chainlink Automation**| Schedule session checks, automate payment release, and handle refund logic        |
| **Chainlink VRF**      | Random audits of sessions to maintain platform trust                               |
| **Chainlink CCIP**     | Enable cross-chain payments and session token transfers                            |

---

## 🛠️ System Architecture
chrono-mint/
├── frontend/ # React.js based DApp interface for users
├── backend/ # Node.js/Express API for wallet linking, scheduling, metadata
├── contracts/ # Solidity smart contracts (ERC-721/ERC-1155, escrow, automation)
├── python-agent/ # Python script interfacing Whisper/OpenAI + transcript analysis
├── eliza-agent/ # AI logic for keyword/topic validation in sessions (Eliza OS based)

---

## 🔁 End-to-End Workflow

### 1. **NFT Minting (Time Slots)**
- Service providers mint **ERC-721 or ERC-1155 NFTs**.
- Each token includes:
  - Metadata: Date, duration, session type, price, availability
  - Optional: Resellable flag

### 2. **Booking & Escrow**
- Users purchase time-slot NFTs.
- Smart contract holds funds in **escrow** until session is verified.
- Token is marked as **booked** and cannot be reused.

### 3. **Session Delivery & Proof**
- Sessions conducted over Zoom, Meet, or Discord.
- Recording/transcript is pulled via **Chainlink Functions**.
- Python + Whisper + Eliza Agent perform:
  - **Topic analysis**
  - **Keyword validation**
  - **Speaker activity verification**

### 4. **Automated Settlement**
- **Chainlink Automation**:
  - Validates session outcome
  - If verified → **Funds released to provider**
  - If failed or no-show → **Refund to buyer**
- **Chainlink VRF**:
  - Random audit selection for further transparency

---

## 🤖 AI Agents

### 🎙️ Python Whisper Agent
- Converts session audio → transcript
- Ensures conversation happened between valid parties

### 🧠 Eliza OS Agent
- Analyzes transcript for:
- Provides the transcript and summary of the online session
  - Topic relevance (session-specific) by ensuring meeting Id
  - Activity (did the provider meaningfully engage?) based on the transcript
  - Completion status 
  - Make decision in transaction based on the conditions

---

## 🌉 Cross-Chain Compatibility

With **Chainlink CCIP**, ChronoMint enables:

- Session NFTs to be purchased using assets on **any supported chain**
- Seamless token flow and time-slot liquidity across ecosystems

---

## 🔐 Security & Trust

- **Escrow contracts** prevent premature payouts
- **AI validation** reduces dispute resolution costs
- **Random audits via Chainlink VRF** build accountability
- **Fully decentralized**, **no third-party custodianship**

---

## 🧪 Example Use Cases

- 🎓 **Web3 Mentors** tokenize 1-on-1 sessions (30 mins slots)
- ⚖️ **Blockchain Lawyers** offer limited-time legal consultations
- 👨‍🏫 **Tutors** sell subject-specific time blocks
- 👩‍🎨 **Freelancers** list availability for design/branding consults

---

## 📦 Tech Stack

- **Solidity** – Smart Contracts (ERC-721, Escrow, Automation hooks)
- **Chainlink** – Functions, Automation, VRF, CCIP
- **React.js** – Frontend interface
- **Node.js/Express** – Backend APIs
- **Python** – AI agent pipeline (Whisper, Eliza OS)
- **Zoom/Otter API** – Transcript generation
- **IPFS** – NFT metadata storage

---

## 🌍 Vision

ChronoMint aims to redefine **how time is valued, traded, and trusted**—decentralizing not just assets but human potential. It creates a **time liquidity layer** for the future of work and open collaboration.

---

## 📄 License

MIT License © 2025 ChronoMint Contributors

---

## 🤝 Contributing

Pull requests welcome. For major changes, please open an issue first to discuss what you’d like to change.

---


