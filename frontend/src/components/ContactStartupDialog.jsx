import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { Label } from "./ui/label"
import { RadioGroup, RadioGroupItem } from "./ui/radio-group"
import { MessageSquare, Loader2, CheckCircle2 } from "lucide-react"
import { useCurrentAccount } from "@mysten/dapp-kit"
import { sendContactRequest } from "../utils/users"

export function ContactStartupDialog({ startup, trigger }) {
  const currentAccount = useCurrentAccount()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    purpose: "invest",
    message: "",
    email: "",
    linkedIn: "",
    phone: ""
  })

  const purposes = [
    { value: "invest", label: "💰 Invest in this startup", description: "I'm interested in funding" },
    { value: "co-found", label: "🤝 Co-founder opportunity", description: "I want to join as a co-founder" },
    { value: "use-product", label: "🛍️ Use the product/service", description: "I want to use their solution" },
    { value: "hire", label: "💼 Hiring opportunity", description: "I want to hire the team" },
    { value: "network", label: "🌐 Network & collaborate", description: "Let's connect and explore synergies" },
    { value: "other", label: "📋 Other", description: "Something else" }
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!currentAccount) {
      alert("Please connect your Sui wallet first")
      return
    }

    setLoading(true)
    
    try {
      const contactInfo = {
        email: formData.email,
        linkedIn: formData.linkedIn,
        phone: formData.phone
      }

      await sendContactRequest({
        fromWallet: currentAccount.address,
        toWallet: startup.walletAddress || startup.owner,
        startupId: startup.id,
        startupName: startup.name,
        purpose: formData.purpose,
        message: formData.message,
        contactInfo
      })

      setSuccess(true)
      setTimeout(() => {
        setOpen(false)
        setSuccess(false)
        setFormData({
          purpose: "invest",
          message: "",
          email: "",
          linkedIn: "",
          phone: ""
        })
      }, 2000)
    } catch (error) {
      console.error("Error sending contact request:", error)
      alert("Failed to send contact request. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const selectedPurpose = purposes.find(p => p.value === formData.purpose)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full">
            <MessageSquare className="w-4 h-4 mr-2" />
            Contact Founder
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Contact {startup.name}</DialogTitle>
          <DialogDescription>
            Connect with the startup founder. Your contact information will be shared with them.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-600 mb-4" />
            <h3 className="text-xl font-semibold text-[#37322f] mb-2">
              Request Sent Successfully!
            </h3>
            <p className="text-[#605a57]">
              The startup owner will receive your message and contact you soon.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Purpose Selection */}
            <div className="space-y-3">
              <Label>What's your interest?</Label>
              <RadioGroup
                value={formData.purpose}
                onValueChange={(value) => setFormData({ ...formData, purpose: value })}
              >
                <div className="grid gap-3">
                  {purposes.map((purpose) => (
                    <div key={purpose.value} className="flex items-start space-x-3">
                      <RadioGroupItem value={purpose.value} id={purpose.value} className="mt-1" />
                      <Label
                        htmlFor={purpose.value}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="font-medium">{purpose.label}</div>
                        <div className="text-xs text-[#605a57]">{purpose.description}</div>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">
                Your Message <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="message"
                placeholder={`Tell the founder why you're interested in ${startup.name}...`}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <Label className="text-base">Your Contact Information</Label>
              
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedIn">LinkedIn Profile (optional)</Label>
                <Input
                  id="linkedIn"
                  type="url"
                  placeholder="https://linkedin.com/in/yourprofile"
                  value={formData.linkedIn}
                  onChange={(e) => setFormData({ ...formData, linkedIn: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            {/* Privacy Notice */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-900">
                🔒 <strong>Privacy Notice:</strong> Your contact information will only be shared with the startup owner. 
                They may reach out to you via the provided email, LinkedIn, or phone number.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={loading || !currentAccount}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Send Request
                  </>
                )}
              </Button>
            </div>

            {!currentAccount && (
              <p className="text-xs text-center text-[#605a57]">
                Please connect your Sui wallet to send a contact request
              </p>
            )}
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
