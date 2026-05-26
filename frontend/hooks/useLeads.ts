"use client"
import { useState, useEffect, useCallback } from "react"
import { leadsApi } from "@/lib/api"
import { Lead } from "@/types"

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await leadsApi.list()
      setLeads(res.data)
    } catch {
      setError("Failed to load leads")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLeads() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const addLead = async (data: object) => {
    const res = await leadsApi.create(data)
    setLeads((prev) => [res.data, ...prev])
    return res.data
  }

  const updateLead = async (id: number, data: Partial<Lead>) => {
    await leadsApi.update(id, data)
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...data } : l)))
  }

  const moveLead = async (id: number, newStatus: Lead["status"]) => {
    await leadsApi.update(id, { status: newStatus }).catch(() => {})
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l)))
  }

  const deleteLead = async (id: number) => {
    await leadsApi.delete(id).catch(() => {})
    setLeads((prev) => prev.filter((l) => l.id !== id))
  }

  const leadsByStage = (stage: Lead["status"]) => leads.filter((l) => l.status === stage)

  return { leads, loading, error, addLead, updateLead, moveLead, deleteLead, leadsByStage, refetch: fetchLeads }
}
