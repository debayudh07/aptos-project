/* eslint-disable */
"use client"

import { useAutoConnect } from "@/components/AutoConnectProvider"
import { DisplayValue, LabelValueGrid } from "@/components/LabelValueGrid"
import { WalletSelector as ShadcnWalletSelector } from "@/components/WalletSelector"
import { useWallet } from "@aptos-labs/wallet-adapter-react"
import { AlertCircle, Plus, Stethoscope, Calendar, ClipboardList } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Aptos, AptosConfig, Network as AptosNetwork } from "@aptos-labs/ts-sdk"

// Imports for registering a browser extension wallet plugin on page load
import { MyWallet } from "@/utils/standardWallet"
import { registerWallet } from "@aptos-labs/wallet-standard"

// Add these imports at the top of the file, after the existing imports
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
// Example of how to register a browser extension wallet plugin.
// Browser extension wallets should call registerWallet once on page load.
import { toast } from "@/hooks/use-toast"
;(() => {
  if (typeof window === "undefined") return
  const myWallet = new MyWallet()
  registerWallet(myWallet)
})()

// Contract information
const MODULE_ADDRESS = "0x8e46115deae69c3ffc41c50f29c94501935467de0212a666d2f0f0b83f1574ac"
const MODULE_NAME = "healthcare"

export default function Home() {
  const { account, connected, network, wallet, signAndSubmitTransaction } = useWallet()
  const [isLoading, setIsLoading] = useState(false)
  const [aptosClient, setAptosClient] = useState<Aptos | null>(null)

  useEffect(() => {
    if (network) {
      const config = new AptosConfig({
        network: network.name.toLowerCase() === "mainnet" ? AptosNetwork.MAINNET : AptosNetwork.TESTNET,
      })
      setAptosClient(new Aptos(config))
    }
  }, [network])

  // Replace the main return statement with this enhanced version (around line 73)
  // This keeps the same structure but adds subtle styling improvements
  return (
    <main className="flex flex-col w-full max-w-[1200px] p-6 pb-12 md:px-8 gap-6 mx-auto bg-gradient-to-b from-background to-background/50">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between gap-6 pb-10"
      >
        <div className="flex flex-col gap-2 md:gap-3">
          <h1 className="text-xl sm:text-3xl font-semibold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Medical Records System
            {network?.name ? ` — ${network.name}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground font-medium leading-none">
            Secure blockchain-based medical records management
          </p>
        </div>
        <div>
          <ShadcnWalletSelector />
        </div>
      </motion.div>

      <WalletConnection />

      {connected && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <MedicalRecordsDashboard
            account={account}
            network={network}
            connected={connected}
            aptosClient={aptosClient}
            signAndSubmitTransaction={signAndSubmitTransaction}
            setIsLoading={setIsLoading}
            isLoading={isLoading}
          />
        </motion.div>
      )}

      {!connected && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center justify-center p-12 gap-4 rounded-lg border bg-card text-card-foreground shadow-md hover:shadow-lg transition-all duration-300 backdrop-blur-sm bg-opacity-90"
        >
          <AlertCircle className="h-12 w-12 text-amber-500" />
          <h2 className="text-xl font-medium">Connect Your Wallet</h2>
          <p className="text-center text-muted-foreground">Please connect your wallet to access your medical records</p>
          <div className="mt-4">
            <ShadcnWalletSelector />
          </div>
        </motion.div>
      )}
    </main>
  )
}

// Replace the WalletConnection component with this enhanced version
function WalletConnection() {
  const { account, connected, network, wallet } = useWallet()
  const { autoConnect, setAutoConnect } = useAutoConnect()

  if (!connected) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col gap-4 p-6 rounded-lg border bg-card text-card-foreground shadow-md hover:shadow-lg transition-all duration-300 backdrop-blur-sm bg-opacity-90"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Wallet Connected
        </h2>
        <div className="flex items-center gap-2 bg-primary/10 p-2 rounded-full">
          {wallet?.icon && (
            <Image
              src={wallet.icon || "/placeholder.svg"}
              alt={wallet.name}
              width={24}
              height={24}
              className="rounded-full"
            />
          )}
          <span className="font-medium">{wallet?.name}</span>
        </div>
      </div>
      <div className="text-sm text-muted-foreground overflow-hidden text-ellipsis">
        Address: {account?.address?.toString()}
      </div>
      <div className="text-sm text-muted-foreground">Network: {network?.name || "Unknown"}</div>
      <label className="flex items-center gap-2 cursor-pointer mt-2">
        <input
          type="checkbox"
          checked={autoConnect}
          onChange={(e) => setAutoConnect(e.target.checked)}
          className="h-4 w-4 accent-primary"
        />
        <span className="text-sm">Auto reconnect on page load</span>
      </label>
    </motion.div>
  )
}

// Modify the beginning of the MedicalRecordsDashboard component to add animations
function MedicalRecordsDashboard({
  account,
  network,
  connected,
  aptosClient,
  signAndSubmitTransaction,
  setIsLoading,
  isLoading,
}: {
  account: any
  network: any
  connected: boolean
  aptosClient: Aptos | null
  signAndSubmitTransaction: any
  setIsLoading: (loading: boolean) => void
  isLoading: boolean
}) {
  const [patients, setPatients] = useState<any[]>([])
  const [medicalRecords, setMedicalRecords] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState("")
  const [initialized, setInitialized] = useState(false)

  // Initialize healthcare provider
  const initializeProvider = async () => {
    if (!aptosClient || !account) return

    try {
      setIsLoading(true)

      const transaction = {
        data: {
          function: `${MODULE_ADDRESS}::${MODULE_NAME}::initialize`,
          functionArguments: [],
        },
      }

      const response = await signAndSubmitTransaction(transaction)
      await aptosClient.waitForTransaction({ transactionHash: response.hash })

      setInitialized(true)
      toast({
        title: "Provider Initialized",
        description: "Healthcare provider has been initialized successfully.",
      })
    } catch (error) {
      console.error("Error initializing provider:", error)
      toast({
        title: "Initialization Failed",
        description: error instanceof Error ? error.message : "Failed to initialize healthcare provider.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Check if the provider is initialized
  const checkProviderInitialized = async () => {
    if (!aptosClient || !account) return

    try {
      await aptosClient.getAccountResource({
        accountAddress: account.address,
        resourceType: `${MODULE_ADDRESS}::${MODULE_NAME}::ProviderRegistry`,
      })
      setInitialized(true)
    } catch (error) {
      // If we get a specific error about provider not found, we need to initialize
      if (error instanceof Error && error.message.includes("Resource not found")) {
        setInitialized(false)
      } else {
        // Otherwise, the provider might be initialized but there's another error
        console.error("Error checking provider initialization:", error)
      }
    }
  }

  // Fetch all patients
  const fetchPatients = async () => {
    if (!aptosClient || !account || !initialized) return

    try {
      console.log("Fetching resource at address:", account.address)
      console.log("Resource type:", `${MODULE_ADDRESS}::${MODULE_NAME}::ProviderRegistry`)

      const providerResource = await aptosClient.getAccountResource({
        accountAddress: account.address,
        resourceType: `${MODULE_ADDRESS}::${MODULE_NAME}::ProviderRegistry`,
      })

      // Check if we have a respon

      // Access data based on the structure we see in logs
      // The data might be directly on the resource or under .data
      const resourceData = providerResource.data || providerResource

      // Access patients from the appropriate location
      const patients = resourceData.patients || []

      setPatients(patients)

      if (patients.length > 0 && typeof patients[0] === "object" && patients[0] !== null && "id" in patients[0]) {
        setSelectedPatientId(patients[0].id as string)
      }
    } catch (error) {
      console.error("Error fetching patients:", error)
    }
  }

  // Fetch medical records for a patient
  const fetchMedicalRecords = async (patientId: string) => {
    if (!aptosClient || !account || !initialized || !patientId) return

    try {
      const providerResource = await aptosClient.getAccountResource({
        accountAddress: account.address,
        resourceType: `${MODULE_ADDRESS}::${MODULE_NAME}::ProviderRegistry`,
      })

      // Check if we have a response
      if (!providerResource) {
        console.error("Provider resource is undefined")
        return
      }

      // Access data based on the structure we see in logs
      const resourceData = providerResource.data || providerResource

      // Access medical_records directly from the resource
      const medicalRecords = resourceData.medical_records || []

      // Filter records for the specific patient
      const patientRecords = medicalRecords.filter((record: any) => record.patient_id === patientId)

      setMedicalRecords(patientRecords)
    } catch (error) {
      console.error("Error fetching medical records:", error)
    }
  }

  const fetchAppointments = async (patientId: string) => {
    if (!aptosClient || !account || !initialized || !patientId) return

    try {
      const providerResource = await aptosClient.getAccountResource({
        accountAddress: account.address,
        resourceType: `${MODULE_ADDRESS}::${MODULE_NAME}::ProviderRegistry`,
      })

      // Check if we have a response
      if (!providerResource) {
        console.error("Provider resource is undefined")
        return
      }

      // Access data based on the structure we see in logs
      const resourceData = providerResource.data || providerResource

      // Access appointments directly from the resource
      const appointments = resourceData.appointments || []

      // Filter appointments for the specific patient
      const patientAppointments = appointments.filter((appointment: any) => appointment.patient_id === patientId)

      setAppointments(patientAppointments)
    } catch (error) {
      console.error("Error fetching appointments:", error)
    }
  }

  // Add a new patient
  const addPatient = async (patientData: {
    id: any
    name: any
    age: any
    gender: any
    contact: any
    email: any
    address: any
    medicalHistory: any
  }) => {
    if (!aptosClient || !account || !initialized) return

    try {
      setIsLoading(true)
      const transaction = {
        data: {
          function: `${MODULE_ADDRESS}::${MODULE_NAME}::add_patient`,
          functionArguments: [
            patientData.id,
            patientData.name,
            Number.parseInt(patientData.age),
            patientData.gender,
            patientData.contact,
            patientData.email,
            patientData.address,
            patientData.medicalHistory,
          ],
        },
      }

      const response = await signAndSubmitTransaction(transaction)
      await aptosClient.waitForTransaction({ transactionHash: response.hash })

      toast({
        title: "Patient Added",
        description: "New patient record has been created successfully.",
      })

      // Refresh patient list
      fetchPatients()
    } catch (error) {
      console.error("Error adding patient:", error)
      toast({
        title: "Failed to Add Patient",
        description: error instanceof Error ? error.message : "An error occurred while adding the patient.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Add a medical record
  const addMedicalRecord = async (recordData: {
    patientId: any
    id: any
    recordType: any
    diagnosis: any
    treatment: any
    notes: any
  }) => {
    if (!aptosClient || !account || !initialized) return

    try {
      setIsLoading(true)
      const transaction = {
        data: {
          function: `${MODULE_ADDRESS}::${MODULE_NAME}::add_medical_record`,
          functionArguments: [
            recordData.id,
            recordData.patientId,
            recordData.recordType,
            recordData.diagnosis,
            recordData.treatment,
            recordData.notes,
          ],
        },
      }

      const response = await signAndSubmitTransaction(transaction)
      await aptosClient.waitForTransaction({ transactionHash: response.hash })

      toast({
        title: "Medical Record Added",
        description: "New medical record has been created successfully.",
      })

      // Refresh medical records
      fetchMedicalRecords(recordData.patientId)
    } catch (error) {
      console.error("Error adding medical record:", error)
      toast({
        title: "Failed to Add Medical Record",
        description: error instanceof Error ? error.message : "An error occurred while adding the medical record.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Schedule an appointment
  const scheduleAppointment = async (appointmentData: {
    patientId: any
    id: any
    date: any
    time: any
    purpose: any
  }) => {
    if (!aptosClient || !account || !initialized) return

    try {
      setIsLoading(true)
      const transaction = {
        data: {
          function: `${MODULE_ADDRESS}::${MODULE_NAME}::schedule_appointment`,
          functionArguments: [
            appointmentData.id,
            appointmentData.patientId,
            appointmentData.date,
            appointmentData.time,
            appointmentData.purpose,
            "scheduled", // Default status
          ],
        },
      }

      const response = await signAndSubmitTransaction(transaction)
      await aptosClient.waitForTransaction({ transactionHash: response.hash })

      toast({
        title: "Appointment Scheduled",
        description: "New appointment has been scheduled successfully.",
      })

      // Refresh appointments
      fetchAppointments(appointmentData.patientId)
    } catch (error) {
      console.error("Error scheduling appointment:", error)
      toast({
        title: "Failed to Schedule Appointment",
        description: error instanceof Error ? error.message : "An error occurred while scheduling the appointment.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Update appointment status
  const updateAppointmentStatus = async (appointmentId: any, status: string) => {
    if (!aptosClient || !account || !initialized) return

    try {
      setIsLoading(true)
      const transaction = {
        data: {
          function: `${MODULE_ADDRESS}::${MODULE_NAME}::update_appointment_status`,
          functionArguments: [appointmentId, status],
        },
      }

      const response = await signAndSubmitTransaction(transaction)
      await aptosClient.waitForTransaction({ transactionHash: response.hash })

      toast({
        title: "Appointment Updated",
        description: "Appointment status has been updated successfully.",
      })

      // Refresh appointments
      fetchAppointments(selectedPatientId)
    } catch (error) {
      console.error("Error updating appointment:", error)
      toast({
        title: "Failed to Update Appointment",
        description: error instanceof Error ? error.message : "An error occurred while updating the appointment.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Effects
  useEffect(() => {
    if (aptosClient && account) {
      checkProviderInitialized()
    }
  }, [aptosClient, account])

  useEffect(() => {
    if (initialized) {
      fetchPatients()
    }
  }, [initialized, account, aptosClient])

  useEffect(() => {
    if (selectedPatientId) {
      fetchMedicalRecords(selectedPatientId)
      fetchAppointments(selectedPatientId)
    }
  }, [selectedPatientId])

  // New Patient Form
  const PatientForm = () => {
    const [form, setForm] = useState({
      id: `PAT-${Date.now().toString().slice(-6)}`,
      name: "",
      age: "",
      gender: "Male",
      contact: "",
      email: "",
      address: "",
      medicalHistory: "",
    })

    const [open, setOpen] = useState(false)

    const handleChange = (e: { target: { name: any; value: any } }) => {
      const { name, value } = e.target
      setForm((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = (e: { preventDefault: () => void }) => {
      e.preventDefault()
      addPatient(form)
      setOpen(false)
    }

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="gap-2 transition-all duration-300 hover:bg-primary/10 hover:border-primary/30"
          >
            <Plus size={16} />
            Add Patient
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px] backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Add New Patient
            </DialogTitle>
            <DialogDescription>Enter the patient's details to create a new record</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="id">Patient ID</Label>
                <Input id="id" name="id" value={form.id} onChange={handleChange} required disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" value={form.name} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  type="number"
                  id="age"
                  name="age"
                  min="0"
                  max="120"
                  value={form.age}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  name="gender"
                  value={form.gender}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, gender: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact">Contact</Label>
                <Input id="contact" name="contact" value={form.contact} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" value={form.address} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="medicalHistory">Medical History</Label>
              <Textarea
                id="medicalHistory"
                name="medicalHistory"
                value={form.medicalHistory}
                onChange={handleChange}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Processing..." : "Add Patient"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    )
  }

  // New Medical Record Form
  const MedicalRecordForm = () => {
    const [form, setForm] = useState({
      id: `MR-${Date.now().toString().slice(-6)}`,
      patientId: selectedPatientId,
      recordType: "Examination",
      diagnosis: "",
      treatment: "",
      notes: "",
    })

    const [open, setOpen] = useState(false)

    const handleChange = (e: { target: { name: any; value: any } }) => {
      const { name, value } = e.target
      setForm((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = (e: { preventDefault: () => void }) => {
      e.preventDefault()
      addMedicalRecord({ ...form, patientId: selectedPatientId })
      setOpen(false)
    }

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="gap-2 transition-all duration-300 hover:bg-primary/10 hover:border-primary/30"
          >
            <Stethoscope size={16} />
            Add Medical Record
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px] backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Add Medical Record
            </DialogTitle>
            <DialogDescription>Enter the details of the medical record</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="id">Record ID</Label>
                <Input id="id" name="id" value={form.id} onChange={handleChange} required disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recordType">Record Type</Label>
                <Select
                  name="recordType"
                  value={form.recordType}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, recordType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Examination">Examination</SelectItem>
                    <SelectItem value="Lab Test">Lab Test</SelectItem>
                    <SelectItem value="Surgery">Surgery</SelectItem>
                    <SelectItem value="Prescription">Prescription</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="diagnosis">Diagnosis</Label>
              <Input id="diagnosis" name="diagnosis" value={form.diagnosis} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="treatment">Treatment</Label>
              <Input id="treatment" name="treatment" value={form.treatment} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" value={form.notes} onChange={handleChange} rows={3} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Processing..." : "Add Record"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    )
  }

  // New Appointment Form
  const AppointmentForm = () => {
    const [form, setForm] = useState({
      id: `APT-${Date.now().toString().slice(-6)}`,
      patientId: selectedPatientId,
      date: new Date().toISOString().split("T")[0],
      time: "09:00",
      purpose: "",
    })

    const [open, setOpen] = useState(false)

    const handleChange = (e: { target: { name: any; value: any } }) => {
      const { name, value } = e.target
      setForm((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = (e: { preventDefault: () => void }) => {
      e.preventDefault()
      scheduleAppointment({ ...form, patientId: selectedPatientId })
      setOpen(false)
    }

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="gap-2 transition-all duration-300 hover:bg-primary/10 hover:border-primary/30"
          >
            <Calendar size={16} />
            Schedule Appointment
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px] backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Schedule Appointment
            </DialogTitle>
            <DialogDescription>Enter the details for the new appointment</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="id">Appointment ID</Label>
                <Input id="id" name="id" value={form.id} onChange={handleChange} required disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input type="date" id="date" name="date" value={form.date} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input type="time" id="time" name="time" value={form.time} onChange={handleChange} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose</Label>
              <Input id="purpose" name="purpose" value={form.purpose} onChange={handleChange} required />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Processing..." : "Schedule"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    )
  }

  // Modify the return statement at the end of the component
  // This keeps the same structure but enhances the styling
  return (
    <div className="flex flex-col gap-6">
      {!initialized ? (
        <div className="flex flex-col gap-4 p-6 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all duration-300">
          <h2 className="text-lg font-medium bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Initialize Healthcare Provider
          </h2>
          <p className="text-sm text-muted-foreground">
            You need to initialize your healthcare provider account before you can use the system.
          </p>
          <Button onClick={initializeProvider} disabled={isLoading} className="relative overflow-hidden group">
            <span className="absolute inset-0 w-0 bg-white/20 transition-all duration-500 ease-out group-hover:w-full"></span>
            {isLoading ? "Initializing..." : "Initialize Provider"}
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-col p-6 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-medium bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Patient Management
              </h2>
              <PatientForm />
            </div>

            <div className="mb-4">
              <Label htmlFor="patientSelect">Select Patient</Label>
              <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                <SelectTrigger className="w-full transition-all duration-300 hover:border-primary/50">
                  <SelectValue placeholder="Select a patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.length > 0 ? (
                    patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.name} ({patient.id})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-patients" disabled>
                      No patients found
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedPatientId ? (
              <div>
                {patients.map((patient) => {
                  if (patient.id === selectedPatientId) {
                    return (
                      <div key={patient.id} className="p-4 rounded-lg bg-primary/5 border border-primary/10 transition-all duration-300 hover:border-primary/30">
                        <LabelValueGrid
                          items={[
                            {
                              label: "Patient ID",
                              value: <DisplayValue value={patient.id} isCorrect={true} />,
                            },
                            {
                              label: "Name",
                              value: <p>{patient.name}</p>,
                            },
                            {
                              label: "Age",
                              value: <p>{patient.age}</p>,
                            },
                            {
                              label: "Gender",
                              value: <p>{patient.gender}</p>,
                            },
                            {
                              label: "Contact",
                              value: <p>{patient.contact}</p>,
                            },
                            {
                              label: "Email",
                              value: <p>{patient.email}</p>,
                            },
                            {
                              label: "Address",
                              value: <p>{patient.address}</p>,
                            },
                            {
                              label: "Medical History",
                              value: <p>{patient.medical_history}</p>,
                            },
                          ]}
                        />
                      </div>
                    )
                  }
                  return null
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 gap-4">
                <AlertCircle className="h-8 w-8 text-muted-foreground animate-pulse" />
                <p className="text-center text-muted-foreground">No patient selected or no patients registered</p>
              </div>
            )}
          </div>

          {selectedPatientId && (
            <Tabs defaultValue="records" className="w-full">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="records" className="flex items-center gap-2 transition-all duration-300">
                  <ClipboardList size={16} />
                  Medical Records
                </TabsTrigger>
                <TabsTrigger value="appointments" className="flex items-center gap-2 transition-all duration-300">
                  <Calendar size={16} />
                  Appointments
                </TabsTrigger>
              </TabsList>

              <TabsContent value="records">
                <div className="flex flex-col p-6 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-medium bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                      Medical Records
                    </h2>
                    <MedicalRecordForm />
                  </div>

                  {medicalRecords.length > 0 ? (
                    <div className="flex flex-col gap-4">
                      {medicalRecords.map((record, index) => (
                        <div
                          key={index}
                          className="p-4 border rounded-md hover:shadow-md transition-all duration-300 hover:border-primary/30 bg-card"
                        >
                          <div className="flex justify-between mb-2">
                            <span className="font-medium text-primary">{record.id}</span>
                            <span className="text-sm text-muted-foreground bg-primary/10 px-2 py-1 rounded-full">
                              {new Date(Number.parseInt(record.date) * 1000).toLocaleString()}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Type:</span> {record.record_type}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Diagnosis:</span> {record.diagnosis}
                            </div>
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Treatment:</span> {record.treatment}
                            </div>
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Notes:</span> {record.notes}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 gap-4">
                      <ClipboardList className="h-8 w-8 text-muted-foreground animate-pulse" />
                      <p className="text-center text-muted-foreground">No medical records found for this patient</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="appointments">
                <div className="flex flex-col p-6 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-medium bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                      Appointments
                    </h2>
                    <AppointmentForm />
                  </div>

                  {appointments.length > 0 ? (
                    <div className="flex flex-col gap-4">
                      {appointments.map((appointment, index) => (
                        <div
                          key={index}
                          className="p-4 border rounded-md hover:shadow-md transition-all duration-300 hover:border-primary/30 bg-card"
                        >
                          <div className="flex justify-between mb-2">
                            <span className="font-medium text-primary">{appointment.id}</span>
                            <span
                              className={cn(
                                "text-sm px-2 py-1 rounded-full",
                                appointment.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : appointment.status === "cancelled"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-amber-100 text-amber-800",
                              )}
                            >
                              {appointment.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                            <div>
                              <span className="text-muted-foreground">Date:</span> {appointment.date}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Time:</span> {appointment.time}
                            </div>
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Purpose:</span> {appointment.purpose}
                            </div>
                          </div>
                          {appointment.status === "scheduled" && (
                            <div className="flex gap-2 mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateAppointmentStatus(appointment.id, "completed")}
                                disabled={isLoading}
                                className="hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition-colors duration-300"
                              >
                                Mark as Completed
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateAppointmentStatus(appointment.id, "cancelled")}
                                disabled={isLoading}
                                className="hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors duration-300"
                              >
                                Cancel
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 gap-4">
                      <Calendar className="h-8 w-8 text-muted-foreground animate-pulse" />
                      <p className="text-center text-muted-foreground">No appointments found for this patient</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </>
      )}
    </div>
  )
}