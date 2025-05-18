# Medical Records System on Aptos Blockchain

A secure decentralized healthcare records management system built on the Aptos blockchain. This application enables healthcare providers to manage patient information, medical records, and appointments with blockchain-powered security and immutability.

![Healthcare Blockchain Application](https://res.cloudinary.com/deba/image/upload/v1747552089/Screenshot_2025-05-18_123704_jorbfs.png)

## Features

- **Secure Patient Records**: Store and manage patient information securely on the blockchain
- **Medical History Management**: Track patient diagnoses, treatments, and outcomes
- **Appointment Scheduling**: Schedule and manage patient appointments
- **Blockchain Security**: All data is cryptographically secured on the Aptos blockchain
- **Wallet Integration**: Connect with Petra, Martian, or other Aptos-compatible wallets
- **Provider Authorization**: Access control ensures only authorized healthcare providers can access patient data

## Project Structure

- **Frontend**: Next.js application with UI components (shadcn/ui)
- **Smart Contracts**: Move language contracts deployed on Aptos
- **AI Agent**: Intelligent assistant that can interact with the blockchain system

## Getting Started

### Prerequisites

- Node.js 16+ and npm/yarn/pnpm
- Aptos wallet (Petra, Martian, or compatible wallet)
- Aptos CLI (for contract deployment)

### Installation

1. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/debayudh07/aptos-project
   cd aptos-healthcare/frontend
   npm install
   ```

2. Set up environment variables:
   Create a `.env.local` file with:
   ```
   NEXT_PUBLIC_NETWORK=testnet
   NEXT_PUBLIC_MODULE_ADDRESS=0x8e46115deae69c3ffc41c50f29c94501935467de0212a666d2f0f0b83f1574ac
   NEXT_PUBLIC_MODULE_NAME=healthcare
   ```

### Running the Application

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

### Setting up the AI Agent

1. Navigate to the agent directory:
    ```bash
    cd ../aptos-agent
    ```

2. Create a `.env` file with your Groq API key:
    ```
    GROQ_API_KEY=your_api_key_here
    ```

3. Install Python dependencies:
    ```bash
    pip install -r requirements.txt
    ```

4. Run the AI agent:
    ```bash
    python main.py
    ```

The agent will now be available to interact with the blockchain application.

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Smart Contract Details

The project uses the following Move contract functions:

- `initialize`: Set up a healthcare provider registry
- `add_patient`: Register a new patient
- `add_medical_record`: Add medical records to a patient
- `schedule_appointment`: Schedule patient appointments
- `update_appointment_status`: Modify appointment statuses

The contract is deployed at: `0x8e46115deae69c3ffc41c50f29c94501935467de0212a666d2f0f0b83f1574ac`

## AI Assistant Integration

The project includes an AI agent that can:

- Answer questions about the healthcare system
- Help retrieve patient information
- Provide guidance on using the application
- Interact with the blockchain through natural language

To use the AI assistant:
1. Connect your wallet to the application
2. Click on the chat icon in the interface
3. Ask questions about patients, records, or appointments



## Acknowledgements

- [Aptos Labs](https://aptoslabs.com/) for the blockchain platform
- [Next.js](https://nextjs.org/) for the frontend framework
- [shadcn/ui](https://ui.shadcn.com/) for UI components



