import { useEffect, useState } from 'react'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { formatDateTime, formatDuration } from '@/lib/formatters'
import { applyChange } from '@/lib/realtimeMerge'
import type { Tables } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'

type Device = Tables<'devices'>
type Session = Tables<'sessions'>
type Group = Tables<'groups'>
type Counter = Tables<'counters'>

const SESSION_LIMIT = 50

const deviceKey = (d: Device) => d.device_id
const sessionKey = (s: Session) => s.id
const counterKey = (c: Counter) => `${c.device_id}:${c.id}`

export default function Dashboard() {
  const { signOut } = useAuth()
  const [devices, setDevices] = useState<Device[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [counters, setCounters] = useState<Counter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [live, setLive] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      setLoading(true)
      setError('')

      const [devicesRes, sessionsRes, groupsRes, countersRes] = await Promise.all([
        supabase.from('devices').select('*').order('last_seen_at', { ascending: false }),
        supabase
          .from('sessions')
          .select('*')
          .order('started_at', { ascending: false })
          .limit(SESSION_LIMIT),
        supabase.from('groups').select('*'),
        supabase.from('counters').select('*'),
      ])

      if (cancelled) return

      const firstError =
        devicesRes.error || sessionsRes.error || groupsRes.error || countersRes.error
      if (firstError) {
        setError(firstError.message)
        setLoading(false)
        return
      }

      setDevices(devicesRes.data ?? [])
      setSessions(sessionsRes.data ?? [])
      setGroups(groupsRes.data ?? [])
      setCounters(countersRes.data ?? [])
      setLoading(false)
    }

    loadData()
    return () => {
      cancelled = true
    }
  }, [])

  // Live updates: devices/sessions/counters must have Realtime enabled for
  // their table in the Supabase dashboard (Database > Replication), or these
  // events never arrive — RLS still gates who receives them (authenticated only).
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'devices' },
        (payload: RealtimePostgresChangesPayload<Device>) =>
          setDevices((prev) => applyChange(prev, payload, deviceKey)),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sessions' },
        (payload: RealtimePostgresChangesPayload<Session>) =>
          setSessions((prev) => applyChange(prev, payload, sessionKey).slice(0, SESSION_LIMIT)),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'counters' },
        (payload: RealtimePostgresChangesPayload<Counter>) =>
          setCounters((prev) => applyChange(prev, payload, counterKey)),
      )
      .subscribe((status) => setLive(status === 'SUBSCRIBED'))

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const groupName = (deviceId: string, groupId: string) =>
    groups.find((g) => g.device_id === deviceId && g.id === groupId)?.name ?? groupId

  const workerName = (deviceId: string) =>
    devices.find((d) => d.device_id === deviceId)?.worker_name ?? deviceId

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">Countful Dashboard</h1>
            <Badge variant={live ? 'default' : 'outline'} className="gap-1.5">
              <span
                className={`size-1.5 rounded-full ${live ? 'bg-primary-foreground' : 'bg-muted-foreground'}`}
              />
              {live ? 'Live' : 'Connecting…'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">Live production overview</p>
        </div>
        <Button variant="outline" onClick={signOut}>
          Sign out
        </Button>
      </div>

      {error && (
        <Card className="border-destructive/40">
          <CardContent className="text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Devices</CardTitle>
              <CardDescription>{devices.length} registered</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Worker</TableHead>
                    <TableHead>Device ID</TableHead>
                    <TableHead>Last seen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devices.map((d) => (
                    <TableRow key={d.device_id}>
                      <TableCell>{d.worker_name}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {d.device_id}
                      </TableCell>
                      <TableCell>{formatDateTime(d.last_seen_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sessions</CardTitle>
              <CardDescription>Most recent {SESSION_LIMIT}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Worker</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Ended</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>{s.worker_name}</TableCell>
                      <TableCell>{groupName(s.device_id, s.group_id)}</TableCell>
                      <TableCell>
                        <Badge variant={s.status === 'active' ? 'default' : 'secondary'}>
                          {s.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDuration(s.duration_seconds)}</TableCell>
                      <TableCell>{formatDateTime(s.started_at)}</TableCell>
                      <TableCell>{formatDateTime(s.ended_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Production</CardTitle>
              <CardDescription>Live counter values by device and group</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Worker</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Counter</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {counters.map((c) => (
                    <TableRow key={`${c.device_id}-${c.id}`}>
                      <TableCell>{workerName(c.device_id)}</TableCell>
                      <TableCell>{groupName(c.device_id, c.group_id)}</TableCell>
                      <TableCell>{c.name}</TableCell>
                      <TableCell>{c.count}</TableCell>
                      <TableCell>{c.target ?? '—'}</TableCell>
                      <TableCell>{formatDateTime(c.updated_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
