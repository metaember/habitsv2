'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

interface Household {
  id: string
  name: string
  users: Array<{
    id: string
    name: string
    color?: string
    email?: string
  }>
}

export default function HouseholdManager() {
  const [household, setHousehold] = useState<Household | null>(null)
  const [loading, setLoading] = useState(true)
  const [newHouseholdName, setNewHouseholdName] = useState('')
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [isCreatingHousehold, setIsCreatingHousehold] = useState(false)
  const [isAddingMember, setIsAddingMember] = useState(false)

  useEffect(() => {
    fetchHousehold()
  }, [])

  const fetchHousehold = async () => {
    try {
      const res = await fetch('/api/households')
      const data = await res.json()
      
      if (res.ok && data.household) {
        setHousehold(data.household)
      }
    } catch (error) {
      console.error('Error fetching household:', error)
    } finally {
      setLoading(false)
    }
  }

  const createHousehold = async () => {
    if (!newHouseholdName.trim()) return
    
    setIsCreatingHousehold(true)
    try {
      const res = await fetch('/api/households', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newHouseholdName })
      })
      
      if (res.ok) {
        const data = await res.json()
        setHousehold(data.household)
        setNewHouseholdName('')
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to create household')
      }
    } catch (error) {
      alert('Failed to create household')
    } finally {
      setIsCreatingHousehold(false)
    }
  }

  const addMember = async () => {
    if (!newMemberEmail.trim()) return
    
    setIsAddingMember(true)
    try {
      const res = await fetch('/api/households/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newMemberEmail })
      })
      
      if (res.ok) {
        const data = await res.json()
        setHousehold(data.household)
        setNewMemberEmail('')
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to add member')
      }
    } catch (error) {
      alert('Failed to add member')
    } finally {
      setIsAddingMember(false)
    }
  }

  const removeMember = async (userId: string) => {
    try {
      const res = await fetch(`/api/households/members?userId=${userId}`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        fetchHousehold() // Refresh the household data
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to remove member')
      }
    } catch (error) {
      alert('Failed to remove member')
    }
  }

  if (loading) {
    return <div>Loading household...</div>
  }

  if (!household) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Create Household</h3>
        <p className="text-gray-600 mb-4">
          Create a household to share habits with family members.
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="Household name"
            value={newHouseholdName}
            onChange={(e) => setNewHouseholdName(e.target.value)}
          />
          <Button 
            onClick={createHousehold}
            disabled={isCreatingHousehold || !newHouseholdName.trim()}
          >
            {isCreatingHousehold ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">{household.name}</h3>
      
      <div className="mb-4">
        <h4 className="font-medium mb-2">Members:</h4>
        {household.users.map((user) => (
          <div key={user.id} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <div 
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                style={{ backgroundColor: user.color || '#6366f1' }}
              >
                {user.name.charAt(0)}
              </div>
              <span>{user.name}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => removeMember(user.id)}
              className="text-red-600 hover:text-red-700"
            >
              Remove
            </Button>
          </div>
        ))}
      </div>

      <div>
        <h4 className="font-medium mb-2">Add Member:</h4>
        <div className="flex gap-2">
          <Input
            placeholder="Email address"
            type="email"
            value={newMemberEmail}
            onChange={(e) => setNewMemberEmail(e.target.value)}
          />
          <Button 
            onClick={addMember}
            disabled={isAddingMember || !newMemberEmail.trim()}
          >
            {isAddingMember ? 'Adding...' : 'Add'}
          </Button>
        </div>
      </div>
    </Card>
  )
}