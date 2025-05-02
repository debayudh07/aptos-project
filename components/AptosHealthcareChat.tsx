/* eslint-disable */
"use client"
import { useState, useRef, useEffect } from "react"
import type React from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, X, Send, Loader2, Wallet, RotateCcw, PlusCircle } from "lucide-react"
import { useWallet } from "@aptos-labs/wallet-adapter-react"

interface Message {
  id: number
  text: string
  isBot: boolean
  category?: string
}

interface PatientFormData {
  patientId: string
  name: string
  age: string
  gender: string
  contact: string
  email: string
  address: string
  medicalHistory: string
}

export default function AptosHealthcareChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [showPatientForm, setShowPatientForm] = useState(false)
  const [patientFormData, setPatientFormData] = useState<PatientFormData>({
    patientId: "",
    name: "",
    age: "",
    gender: "",
    contact: "",
    email: "",
    address: "",
    medicalHistory: ""
  })
  const [isSubmittingPatient, setIsSubmittingPatient] = useState(false)
  const [walletBalance, setWalletBalance] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const apiUrl = "http://127.0.0.1:8000" // FastAPI server URL

  // Get wallet information from Aptos wallet adapter
  const { account, connected, network, wallet } = useWallet()
  

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Initialize chat with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      fetchApiHealth()
      setMessages([
        {
          id: Date.now(),
          text: "Hello! I'm your Aptos Healthcare Agent. I can help you manage patients, medical records, and appointments on the blockchain. What would you like to do today?",
          isBot: true,
          category: "greeting"
        }
      ])
    }
  }, [messages])

  // Update wallet information when connection changes
  useEffect(() => {
    if (connected && account) {
      setWalletBalance(`Address: ${formatAddress(account.address.toString())}`)
    } else {
      setWalletBalance(null)
    }
  }, [connected, account])

  const formatAddress = (address: string) => {
    if (!address) return "";
    return address.length > 20 
      ? `${address.substring(0, 10)}...${address.substring(address.length - 5)}`
      : address;
  }

  const fetchApiHealth = async () => {
    try {
      const response = await fetch(`${apiUrl}/health`)
      const data = await response.json()
      if (data.wallet_address) {
        setWalletBalance(`Address: ${formatAddress(data.wallet_address)}`)
      }
    } catch (error) {
      console.error("Error fetching API health:", error)
    }
  }

  const fetchWalletBalance = async () => {
    setIsTyping(true)
    try {
      // If connected to wallet adapter, use that address
      const address = connected && account 
        ? account.address.toString() 
        : "Request wallet connection";

      const response = await fetch(`${apiUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: "What is my wallet balance?",
          address: address
        })
      })
      const data = await response.json()
      setIsTyping(false)
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          text: "What is my wallet balance?",
          isBot: false
        },
        {
          id: Date.now() + 1,
          text: data.response,
          isBot: true,
          category: "wallet"
        }
      ])
    } catch (error) {
      setIsTyping(false)
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          text: "What is my wallet balance?",
          isBot: false
        },
        {
          id: Date.now() + 1,
          text: "Sorry, I couldn't fetch your wallet balance. Please try again later.",
          isBot: true,
          category: "error"
        }
      ])
    }
  }

  const clearChatHistory = async () => {
    try {
      await fetch(`${apiUrl}/clear-history`, {
        method: "POST"
      })
      setMessages([
        {
          id: Date.now(),
          text: "Chat history has been cleared. How can I help you today?",
          isBot: true,
          category: "system"
        }
      ])
    } catch (error) {
      console.error("Error clearing chat history:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    const newMessage = {
      id: Date.now(),
      text: message,
      isBot: false,
    }
    setMessages((prev) => [...prev, newMessage])
    setMessage("")
    setIsTyping(true)

    try {
      // Include wallet address in API requests if connected
      const walletData = connected && account 
        ? { address: account.address.toString() } 
        : {};

      const response = await fetch(`${apiUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: message,
          ...walletData
        })
      })
      const data = await response.json()

      setTimeout(() => {
        setIsTyping(false)
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            text: data.response,
            isBot: true,
            category: determineCategory(data.response)
          },
        ])
      }, 800)
    } catch (error) {
      setTimeout(() => {
        setIsTyping(false)
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            text: "Sorry, I'm having trouble connecting to the Aptos blockchain. Please try again later.",
            isBot: true,
            category: "error"
          },
        ])
      }, 800)
    }
  }

  const determineCategory = (text: string): string => {
    const lowerText = text.toLowerCase()
    if (lowerText.includes("patient") || lowerText.includes("record")) {
      return "healthcare"
    } else if (lowerText.includes("wallet") || lowerText.includes("balance") || lowerText.includes("fund") || lowerText.includes("transfer")) {
      return "wallet"
    } else if (lowerText.includes("appointment")) {
      return "appointment"
    } else if (lowerText.includes("error") || lowerText.includes("sorry")) {
      return "error"
    } else if (lowerText.includes("success") || lowerText.includes("added") || lowerText.includes("created")) {
      return "success"
    } else {
      return "general"
    }
  }

  const handlePatientFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setPatientFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingPatient(true)

    const patientMessage = `Add a new patient with the following details:
Patient ID: ${patientFormData.patientId}
Name: ${patientFormData.name}
Age: ${patientFormData.age}
Gender: ${patientFormData.gender}
Contact: ${patientFormData.contact}
Email: ${patientFormData.email}
Address: ${patientFormData.address}
Medical History: ${patientFormData.medicalHistory}`

    try {
      // Include wallet address in API requests if connected
      const walletData = connected && account 
        ? { address: account.address.toString() } 
        : {};

      const response = await fetch(`${apiUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: patientMessage,
          ...walletData
        })
      })

      const data = await response.json()
      setIsSubmittingPatient(false)
      setShowPatientForm(false)

      // Add messages to chat
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          text: patientMessage,
          isBot: false
        },
        {
          id: Date.now() + 1,
          text: data.response,
          isBot: true,
          category: "healthcare"
        }
      ])

      // Reset form
      setPatientFormData({
        patientId: "",
        name: "",
        age: "",
        gender: "",
        contact: "",
        email: "",
        address: "",
        medicalHistory: ""
      })
    } catch (error) {
      setIsSubmittingPatient(false)
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          text: patientMessage,
          isBot: false
        },
        {
          id: Date.now() + 1,
          text: "There was an error adding the patient to the blockchain. Please try again later.",
          isBot: true,
          category: "error"
        }
      ])
    }
  }

  function getCategoryColor(category?: string) {
    switch (category) {
      case "healthcare":
        return "bg-blue-100 border-blue-200"
      case "wallet":
        return "bg-purple-100 border-purple-200"
      case "appointment":
        return "bg-yellow-100 border-yellow-200"
      case "technical":
        return "bg-gray-100 border-gray-200"
      case "greeting":
        return "bg-green-100 border-green-200"
      case "success":
        return "bg-green-100 border-green-200"
      case "error":
        return "bg-red-100 border-red-200"
      case "system":
        return "bg-gray-100 border-gray-200"
      default:
        return "bg-white border-gray-200"
    }
  }

  // Wallet connection status component
  const renderWalletStatus = () => {
    if (!connected) {
      return (
        <div className="text-xs opacity-80">
          Wallet not connected
        </div>
      );
    }
    
    return (
      <div className="flex flex-col">
        <div className="text-xs opacity-80">
          {walletBalance}
        </div>
        <div className="text-xs opacity-80">
          Network: {network?.name || "Unknown"}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            onClick={() => setIsOpen(true)}
            className="bg-gradient-to-r from-blue-400 to-blue-500 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
          >
            <MessageSquare className="w-8 h-8" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="bg-white rounded-2xl shadow-2xl overflow-hidden w-96 max-h-[80vh] flex flex-col"
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
          >
            <motion.div className="flex justify-between items-center p-4 border-b bg-gradient-to-r from-blue-400 to-blue-500 text-white">
              <div className="flex flex-col">
                <h2 className="text-lg font-semibold">Aptos Healthcare Agent</h2>
                {renderWalletStatus()}
              </div>
              <div className="flex gap-2">
                <motion.button 
                  onClick={fetchWalletBalance} 
                  className="text-white p-1 hover:bg-blue-600 rounded"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Check wallet balance"
                >
                  <Wallet className="w-5 h-5" />
                </motion.button>
                <motion.button 
                  onClick={() => setShowPatientForm(!showPatientForm)} 
                  className="text-white p-1 hover:bg-blue-600 rounded"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Add new patient"
                >
                  <PlusCircle className="w-5 h-5" />
                </motion.button>
                <motion.button 
                  onClick={clearChatHistory} 
                  className="text-white p-1 hover:bg-blue-600 rounded"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Clear chat history"
                >
                  <RotateCcw className="w-5 h-5" />
                </motion.button>
                <motion.button 
                  onClick={() => setIsOpen(false)} 
                  className="text-white p-1 hover:bg-blue-600 rounded"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-6 h-6" />
                </motion.button>
              </div>
            </motion.div>

            <AnimatePresence>
              {showPatientForm ? (
                <motion.div
                  className="flex-1 overflow-y-auto p-4 bg-gray-50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <h3 className="font-medium mb-4">Add New Patient to Blockchain</h3>
                  <form onSubmit={handlePatientSubmit} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID</label>
                      <input
                        type="text"
                        name="patientId"
                        value={patientFormData.patientId}
                        onChange={handlePatientFormChange}
                        className="w-full rounded-md border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        name="name"
                        value={patientFormData.name}
                        onChange={handlePatientFormChange}
                        className="w-full rounded-md border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                        <input
                          type="number"
                          name="age"
                          value={patientFormData.age}
                          onChange={handlePatientFormChange}
                          className="w-full rounded-md border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                        <select
                          name="gender"
                          value={patientFormData.gender}
                          onChange={handlePatientFormChange}
                          className="w-full rounded-md border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                          required
                        >
                          <option value="">Select</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                      <input
                        type="text"
                        name="contact"
                        value={patientFormData.contact}
                        onChange={handlePatientFormChange}
                        className="w-full rounded-md border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={patientFormData.email}
                        onChange={handlePatientFormChange}
                        className="w-full rounded-md border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <input
                        type="text"
                        name="address"
                        value={patientFormData.address}
                        onChange={handlePatientFormChange}
                        className="w-full rounded-md border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Medical History</label>
                      <textarea
                        name="medicalHistory"
                        value={patientFormData.medicalHistory}
                        onChange={handlePatientFormChange}
                        className="w-full rounded-md border p-2 text-sm h-24 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowPatientForm(false)}
                        className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingPatient}
                        className="flex-1 py-2 px-4 bg-gradient-to-r from-blue-400 to-blue-500 rounded-md text-sm font-medium text-white hover:shadow-md disabled:opacity-70"
                      >
                        {isSubmittingPatient ? (
                          <span className="flex items-center justify-center">
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Submitting...
                          </span>
                        ) : (
                          "Add to Blockchain"
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {messages.map((msg) => (
                    <motion.div 
                      key={msg.id} 
                      className={`flex ${msg.isBot ? "justify-start" : "justify-end"}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div 
                        className={`max-w-[80%] rounded-2xl p-3 ${
                          msg.isBot 
                            ? `${getCategoryColor(msg.category)} text-gray-800 border` 
                            : "bg-blue-400 text-white"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-line">{msg.text}</p>
                        {msg.category && msg.isBot && !["greeting", "error", "success", "system"].includes(msg.category || "") && (
                          <span className="inline-block mt-2 text-xs text-gray-500">
                            {msg.category}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}

                  {isTyping && (
                    <motion.div className="flex justify-start">
                      <div className="bg-white text-gray-800 rounded-2xl p-3 border border-gray-200">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                          <p className="text-sm text-gray-500">Thinking...</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </motion.div>
              )}
            </AnimatePresence>

            {!showPatientForm && (
              <motion.form onSubmit={handleSubmit} className="p-4 border-t bg-white">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ask about healthcare on blockchain..."
                    className="flex-1 rounded-full border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-blue-400 to-blue-500 text-white p-3 rounded-full hover:shadow-md disabled:opacity-70"
                    disabled={!message.trim() || isTyping}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </motion.form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}