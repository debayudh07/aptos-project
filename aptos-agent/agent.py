import os
import json
import inspect
import asyncio
import requests
from requests_oauthlib import OAuth1
from dotenv import load_dotenv
from aptos_sdk.account import Account
from aptos_sdk.transactions import EntryFunction, TransactionArgument
from aptos_sdk.type_tag import TypeTag, StructTag
from aptos_sdk_wrapper import get_balance, fund_wallet, transfer, create_token
from groq import Groq

# Load environment variables from .env file
load_dotenv()

# Initialize the event loop
loop = asyncio.new_event_loop()
asyncio.set_event_loop(loop)

# Get private key from environment variables
private_key = os.getenv("APTOS_PRIVATE_KEY")
if not private_key:
    print("Warning: APTOS_PRIVATE_KEY not found in environment. Using hardcoded key for demo only.")
    private_key = "0x5377295851e0b5f6ad4ca4d884e293838caa4b98366f643c9585e4f56583b0df"

# Initialize wallet
wallet = Account.load_key(private_key)
address = str(wallet.address())

# Healthcare contract address - this is the module publisher's address
HEALTHCARE_MODULE_ADDRESS = "0x8e46115deae69c3ffc41c50f29c94501935467de0212a666d2f0f0b83f1574ac"
HEALTHCARE_MODULE_NAME = "healthcare"

# Initialize Groq client with API key from environment variables
groq_api_key = os.getenv("GROQ_API_KEY")
if not groq_api_key:
    print("Warning: GROQ_API_KEY not found in environment. Using hardcoded key for demo only.")
    groq_api_key = "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"

groq_client = Groq(api_key=groq_api_key)

def get_weather(location, time="now"):
    """Get the current weather in a given location. Location MUST be a city."""
    return json.dumps({"location": location, "temperature": "65", "time": time})

def send_email(recipient, subject, body):
    print("Sending email...")
    print(f"To: {recipient}\nSubject: {subject}\nBody: {body}")
    return "Sent!"

def fund_wallet_in_apt_sync(amount: int):
    try:
        return loop.run_until_complete(fund_wallet(address, amount))
    except Exception as e:
        return f"Error funding wallet: {str(e)}"

def get_balance_in_apt_sync():
    try:
        return loop.run_until_complete(get_balance(address))
    except Exception as e:
        return f"Error getting balance: {str(e)}"

def transfer_in_octa_sync(sender, receiver, amount: int):
    try:
        return loop.run_until_complete(transfer(sender, receiver, amount))
    except Exception as e:
        return f"Error transferring funds: {str(e)}"

def create_token_sync(sender, name: str, symbol: str, icon_uri: str, project_uri: str):
    try:
        return loop.run_until_complete(create_token(wallet, name, symbol, icon_uri, project_uri))
    except Exception as e:
        print(f"Error creating token: {str(e)}")
        return f"Error creating token: {str(e)}"

def post_tweet(tweet_text: str):
    url = "https://api.twitter.com/2/tweets"
    
    auth = OAuth1(
        os.getenv("TWITTER_API_KEY"),
        os.getenv("TWITTER_API_SECRET"),
        os.getenv("TWITTER_ACCESS_TOKEN"),
        os.getenv("TWITTER_ACCESS_TOKEN_SECRET")
    )
    payload = {
        "text": tweet_text
    }
    
    try:
        response = requests.post(url, auth=auth, json=payload)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        return f"Error posting tweet: {str(e)}"

def get_transaction_history(address_to_check=None):
    """Get transaction history for a specific address or the agent's address."""
    target_address = address_to_check if address_to_check else address
    
    try:
        # Using Aptos API to get transaction history
        url = f"https://fullnode.testnet.aptoslabs.com/v1/accounts/{target_address}/transactions"
        response = requests.get(url)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return f"Error fetching transaction history: {str(e)}"

def get_on_chain_data(resource_type, address_to_check=None):
    """Get on-chain data for a specific address and resource type."""
    target_address = address_to_check if address_to_check else address
    
    try:
        url = f"https://fullnode.testnet.aptoslabs.com/v1/accounts/{target_address}/resource/{resource_type}"
        response = requests.get(url)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return f"Error fetching on-chain data: {str(e)}"

async def execute_entry_function(function_name, type_args, args):
    """Execute an entry function on the Aptos blockchain."""
    try:
        from aptos_sdk.client import RestClient
        client = RestClient("https://fullnode.testnet.aptoslabs.com")
        
        # Build the entry function
        module_address = HEALTHCARE_MODULE_ADDRESS
        module_name = HEALTHCARE_MODULE_NAME
        
        entry_function = EntryFunction.natural(
            f"{module_address}::{module_name}",
            function_name,
            type_args,
            args
        )
        
        # Submit the transaction
        signed_tx = await client.create_bcs_signed_transaction(
            wallet, 
            entry_function
        )
        tx_hash = await client.submit_bcs_transaction(signed_tx)
        
        # Wait for transaction confirmation
        result = await client.wait_for_transaction(tx_hash)
        return {
            "transaction_hash": tx_hash,
            "success": True,
            "result": result
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def initialize_healthcare_provider_sync():
    """Initialize the healthcare provider on the blockchain."""
    try:
        result = loop.run_until_complete(execute_entry_function(
            "initialize",
            [],  # no type args
            []   # no args
        ))
        return json.dumps(result)
    except Exception as e:
        return f"Error initializing healthcare provider: {str(e)}"

def add_patient_sync(patient_id: str, name: str, age: int, gender: str, contact: str, email: str, address_str: str, medical_history: str):
    """Add a new patient to the healthcare system."""
    try:
        args = [
            TransactionArgument(patient_id, TransactionArgument.STRING),
            TransactionArgument(name, TransactionArgument.STRING),
            TransactionArgument(age, TransactionArgument.U8),
            TransactionArgument(gender, TransactionArgument.STRING),
            TransactionArgument(contact, TransactionArgument.STRING),
            TransactionArgument(email, TransactionArgument.STRING),
            TransactionArgument(address_str, TransactionArgument.STRING),
            TransactionArgument(medical_history, TransactionArgument.STRING),
        ]
        
        result = loop.run_until_complete(execute_entry_function(
            "add_patient",
            [],  # no type args
            args
        ))
        return json.dumps(result)
    except Exception as e:
        return f"Error adding patient: {str(e)}"

def add_medical_record_sync(record_id: str, patient_id: str, record_type: str, diagnosis: str, treatment: str, notes: str):
    """Add a medical record for a patient."""
    try:
        args = [
            TransactionArgument(record_id, TransactionArgument.STRING),
            TransactionArgument(patient_id, TransactionArgument.STRING),
            TransactionArgument(record_type, TransactionArgument.STRING),
            TransactionArgument(diagnosis, TransactionArgument.STRING),
            TransactionArgument(treatment, TransactionArgument.STRING),
            TransactionArgument(notes, TransactionArgument.STRING),
        ]
        
        result = loop.run_until_complete(execute_entry_function(
            "add_medical_record",
            [],  # no type args
            args
        ))
        return json.dumps(result)
    except Exception as e:
        return f"Error adding medical record: {str(e)}"

def schedule_appointment_sync(appointment_id: str, patient_id: str, date: str, time: str, purpose: str, status: str):
    """Schedule an appointment for a patient."""
    try:
        args = [
            TransactionArgument(appointment_id, TransactionArgument.STRING),
            TransactionArgument(patient_id, TransactionArgument.STRING),
            TransactionArgument(date, TransactionArgument.STRING),
            TransactionArgument(time, TransactionArgument.STRING),
            TransactionArgument(purpose, TransactionArgument.STRING),
            TransactionArgument(status, TransactionArgument.STRING),
        ]
        
        result = loop.run_until_complete(execute_entry_function(
            "schedule_appointment",
            [],  # no type args
            args
        ))
        return json.dumps(result)
    except Exception as e:
        return f"Error scheduling appointment: {str(e)}"

def update_appointment_status_sync(appointment_id: str, new_status: str):
    """Update the status of an appointment."""
    try:
        args = [
            TransactionArgument(appointment_id, TransactionArgument.STRING),
            TransactionArgument(new_status, TransactionArgument.STRING),
        ]
        
        result = loop.run_until_complete(execute_entry_function(
            "update_appointment_status",
            [],  # no type args
            args
        ))
        return json.dumps(result)
    except Exception as e:
        return f"Error updating appointment status: {str(e)}"

def update_patient_sync(patient_id: str, name: str, age: int, contact: str, email: str, address_str: str, medical_history: str):
    """Update patient information."""
    try:
        args = [
            TransactionArgument(patient_id, TransactionArgument.STRING),
            TransactionArgument(name, TransactionArgument.STRING),
            TransactionArgument(age, TransactionArgument.U8),
            TransactionArgument(contact, TransactionArgument.STRING),
            TransactionArgument(email, TransactionArgument.STRING),
            TransactionArgument(address_str, TransactionArgument.STRING),
            TransactionArgument(medical_history, TransactionArgument.STRING),
        ]
        
        result = loop.run_until_complete(execute_entry_function(
            "update_patient",
            [],  # no type args
            args
        ))
        return json.dumps(result)
    except Exception as e:
        return f"Error updating patient: {str(e)}"

def get_patients_sync(provider_addr=None):
    """Get all patients (view function)."""
    provider_addr = provider_addr if provider_addr else address
    
    try:
        # For view functions, we use the REST API directly
        url = f"https://fullnode.testnet.aptoslabs.com/v1/view"
        payload = {
            "function": f"{HEALTHCARE_MODULE_ADDRESS}::{HEALTHCARE_MODULE_NAME}::get_patients",
            "type_arguments": [],
            "arguments": [provider_addr]
        }
        
        response = requests.post(url, json=payload)
        response.raise_for_status()
        return json.dumps(response.json())
    except Exception as e:
        return f"Error getting patients: {str(e)}"

def get_patient_records_sync(patient_id: str, provider_addr=None):
    """Get medical records for a specific patient."""
    provider_addr = provider_addr if provider_addr else address
    
    try:
        url = f"https://fullnode.testnet.aptoslabs.com/v1/view"
        payload = {
            "function": f"{HEALTHCARE_MODULE_ADDRESS}::{HEALTHCARE_MODULE_NAME}::get_patient_records",
            "type_arguments": [],
            "arguments": [provider_addr, patient_id]
        }
        
        response = requests.post(url, json=payload)
        response.raise_for_status()
        return json.dumps(response.json())
    except Exception as e:
        return f"Error getting patient records: {str(e)}"

def get_patient_appointments_sync(patient_id: str, provider_addr=None):
    """Get appointments for a specific patient."""
    provider_addr = provider_addr if provider_addr else address
    
    try:
        url = f"https://fullnode.testnet.aptoslabs.com/v1/view"
        payload = {
            "function": f"{HEALTHCARE_MODULE_ADDRESS}::{HEALTHCARE_MODULE_NAME}::get_patient_appointments",
            "type_arguments": [],
            "arguments": [provider_addr, patient_id]
        }
        
        response = requests.post(url, json=payload)
        response.raise_for_status()
        return json.dumps(response.json())
    except Exception as e:
        return f"Error getting patient appointments: {str(e)}"

def close_event_loop():
    loop.close()

class GroqAgent:
    def __init__(self, name, model, instructions, functions):
        self.name = name
        self.model = model
        self.instructions = instructions.format(address=address, module_address=HEALTHCARE_MODULE_ADDRESS)
        self.functions = {func.__name__: func for func in functions}
        self.chat_history = []
    
    def _format_function_info(self):
        """Format function descriptions for Groq"""
        function_descriptions = []
        for func_name, func in self.functions.items():
            # Get function signature and docstring
            sig = inspect.signature(func)
            doc = inspect.getdoc(func) or "No description available"
            
            # Format parameters
            parameters = {}
            for param_name, param in sig.parameters.items():
                param_type = "string"  # Default type
                if param.annotation != inspect.Parameter.empty:
                    if param.annotation == int:
                        param_type = "integer"
                    elif param.annotation == float:
                        param_type = "number"
                    elif param.annotation == bool:
                        param_type = "boolean"
                
                parameters[param_name] = {
                    "type": param_type,
                    "description": f"Parameter {param_name} for function {func_name}"
                }
            
            function_descriptions.append({
                "name": func_name,
                "description": doc,
                "parameters": {
                    "type": "object",
                    "properties": parameters,
                    "required": [p for p in parameters.keys() 
                               if p in [p.name for p in sig.parameters.values() 
                                      if p.default == inspect.Parameter.empty]]
                }
            })
        
        return function_descriptions
    
    def run(self, user_message):
        """Process user message and return agent response"""
        # Add user message to history
        self.chat_history.append({"role": "user", "content": user_message})
        
        # Prepare messages for the API call
        messages = [{"role": "system", "content": self.instructions}] + self.chat_history
        
        try:
            # Get function descriptions
            function_descriptions = self._format_function_info()
            
            # Make API call to Groq
            response = groq_client.chat.completions.create(
                model=self.model,
                messages=messages,
                tools=[{"type": "function", "function": fd} for fd in function_descriptions],
                temperature=0.2
            )
            
            # Extract the response
            result = response.choices[0].message
            
            # Handle function calls if present
            if hasattr(result, 'tool_calls') and result.tool_calls:
                function_responses = []
                for tool_call in result.tool_calls:
                    if tool_call.type == 'function':
                        function_name = tool_call.function.name
                        function_args = json.loads(tool_call.function.arguments)
                        
                        # Execute the function if it exists
                        if function_name in self.functions:
                            function_response = self.functions[function_name](**function_args)
                            function_responses.append(f"Function {function_name} returned: {function_response}")
                
                # Add function results to history
                self.chat_history.append({
                    "role": "assistant", 
                    "content": result.content or "I'll help with that."
                })
                
                # Make a follow-up call with the function results
                function_message = "Results from function calls:\n" + "\n".join(function_responses)
                self.chat_history.append({"role": "user", "content": function_message})
                
                # Make a second API call to process the function results
                follow_up_response = groq_client.chat.completions.create(
                    model=self.model,
                    messages=[{"role": "system", "content": self.instructions}] + self.chat_history,
                    temperature=0.2
                )
                
                # Extract the final response
                result = follow_up_response.choices[0].message
            
            # Add assistant response to history
            self.chat_history.append({
                "role": "assistant", 
                "content": result.content
            })
            
            # Return the response content
            return result.content
            
        except Exception as e:
            error_message = f"Error processing message: {str(e)}"
            print(error_message)
            return error_message


# Create the Aptos agent with healthcare capabilities
aptos_agent = GroqAgent(
    name="Aptos Healthcare Agent",
    model="llama3-8b-8192",
    instructions="""You are an AI assistant specialized in Aptos blockchain with ACTUAL transaction capabilities, focusing on healthcare contract interactions.
    You have direct access to the Aptos testnet and can perform REAL blockchain operations including:
    
    1. Checking wallet balances (these are real balances)
    2. Transferring tokens (these are real transfers that move actual tokens)
    3. Creating tokens (these actually create tokens on the blockchain)
    4. Funding wallets (this actually adds funds to the wallet)
    5. Interacting with a healthcare smart contract by:
       - Initializing healthcare providers
       - Adding and updating patients
       - Adding medical records
       - Scheduling and managing appointments
    
    Your wallet address is {address} and the healthcare module address is {module_address}.
    
    When users ask you to perform transactions, DO NOT say you're simulating - 
    you are executing actual blockchain operations through the Aptos testnet.
    
    Always confirm with the user before executing transactions that move funds or modify healthcare data.
    
    When dealing with healthcare data, emphasize the importance of privacy, security, and ethical handling of sensitive information.
    """,
    functions=[
        get_weather,
        send_email,
        fund_wallet_in_apt_sync,
        get_balance_in_apt_sync,
        transfer_in_octa_sync,
        create_token_sync,
        get_transaction_history,
        get_on_chain_data,
        initialize_healthcare_provider_sync,
        add_patient_sync,
        add_medical_record_sync,
        schedule_appointment_sync,
        update_appointment_status_sync,
        update_patient_sync,
        get_patients_sync,
        get_patient_records_sync,
        get_patient_appointments_sync
    ]
)

# Make the agent available for import
__all__ = ['aptos_agent']