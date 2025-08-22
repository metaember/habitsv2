'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'react-hot-toast'

export default function SettingsPage() {
  const [kioskMode, setKioskMode] = useState(false)
  const [kioskPin, setKioskPin] = useState('')
  const [theme, setTheme] = useState('light')
  const [textSize, setTextSize] = useState('medium')
  const [haptics, setHaptics] = useState(true)

  const handleExport = async () => {
    try {
      const res = await fetch('/api/export.jsonl')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'habits-export.jsonl'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Data exported successfully!')
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Export failed')
    }
  }

  const handleSave = async () => {
    // In a real implementation, you would save these settings to the database
    toast.success('Settings saved successfully!')
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <Button onClick={handleSave}>Save</Button>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Display</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="theme">Theme</Label>
            <select 
              id="theme"
              className="w-full p-2 border rounded"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          
          <div>
            <Label htmlFor="textSize">Text Size</Label>
            <select 
              id="textSize"
              className="w-full p-2 border rounded"
              value={textSize}
              onChange={(e) => setTextSize(e.target.value)}
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
          
          <div className="flex items-center">
            <input 
              type="checkbox" 
              id="haptics" 
              className="mr-2" 
              checked={haptics}
              onChange={(e) => setHaptics(e.target.checked)}
            />
            <Label htmlFor="haptics">Enable haptics</Label>
          </div>
        </CardContent>
      </Card>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center">
            <input 
              type="checkbox" 
              id="kiosk" 
              className="mr-2" 
              checked={kioskMode}
              onChange={(e) => setKioskMode(e.target.checked)}
            />
            <Label htmlFor="kiosk">Enable kiosk mode</Label>
          </div>
          
          {kioskMode && (
            <div>
              <Label htmlFor="kioskPin">Kiosk PIN</Label>
              <Input
                id="kioskPin"
                type="password"
                value={kioskPin}
                onChange={(e) => setKioskPin(e.target.value)}
                placeholder="Enter 4-digit PIN"
                maxLength={4}
              />
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Data</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExport}>Export Data</Button>
        </CardContent>
      </Card>
    </div>
  )
}