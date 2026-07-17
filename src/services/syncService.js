// src/services/syncService.js
//
// Talks to Supabase exclusively through SECURITY DEFINER RPC functions (see
// supabase_functions.sql). The app's publishable (anon) key can execute these
// functions but has NO direct table access, so production data can never be
// read via the key embedded in the APK. Every call is fire-and-forget from the
// caller's perspective (offline-first): errors are logged, never thrown, so a
// failed/slow network request can't block local functionality.

import { supabase } from "./supabaseClient";
import { StorageService } from "./storageService";

export const SyncService = {
  // Registers/refreshes this device.
  registerDevice: async (syncDeviceId, workerName) => {
    if (!syncDeviceId) return;
    try {
      const { error } = await supabase.rpc("register_device", {
        p_device_id: syncDeviceId,
        p_worker_name: workerName || "Unknown Worker",
      });
      if (error) throw error;
    } catch (e) {
      console.error("Sync: registerDevice failed", e);
    }
  },

  // Mirrors every group + its counter items for this device. An empty array
  // is a valid payload (deleting the last group / logout must propagate so
  // the server doesn't keep stale rows) — only bail when groups is missing.
  syncGroupsAndCounters: async (syncDeviceId, groups) => {
    if (!syncDeviceId || !groups) return;
    try {
      const payload = groups.map((g) => ({
        id: g.id,
        name: g.name,
        items: (g.items || []).map((item) => ({
          id: item.id,
          name: item.name,
          count: item.count || 0,
          target: item.target ?? null,
        })),
      }));
      const { error } = await supabase.rpc("sync_groups_and_counters", {
        p_device_id: syncDeviceId,
        p_groups: payload,
      });
      if (error) throw error;
    } catch (e) {
      console.error("Sync: syncGroupsAndCounters failed", e);
    }
  },

  // Starts an "active" session; returns its generated uuid (needed to update
  // the same row on completion), or null on failure.
  startRemoteSession: async ({ syncDeviceId, groupId, workerName, startedAt }) => {
    if (!syncDeviceId) return null;
    try {
      const { data, error } = await supabase.rpc("start_session", {
        p_device_id: syncDeviceId,
        p_group_id: groupId,
        p_worker_name: workerName || "Unknown Worker",
        p_started_at: startedAt,
      });
      if (error) throw error;
      return data; // the returned uuid
    } catch (e) {
      console.error("Sync: startRemoteSession failed", e);
      return null;
    }
  },

  // Flips an active session to completed. Returns true/false so the caller
  // knows whether to mark the local log synced.
  completeRemoteSession: async ({ remoteSessionId, items, durationSeconds, endedAt }) => {
    if (!remoteSessionId) return false;
    try {
      const { error } = await supabase.rpc("complete_session", {
        p_session_id: remoteSessionId,
        p_items: items,
        p_duration_seconds: durationSeconds,
        p_ended_at: endedAt,
      });
      if (error) throw error;
      return true;
    } catch (e) {
      console.error("Sync: completeRemoteSession failed", e);
      return false;
    }
  },

  // Uploads an already-finished local session record in one shot (retry /
  // offline backfill).
  uploadCompletedSessionRecord: async (syncDeviceId, record) => {
    if (!syncDeviceId) return false;
    try {
      const { error } = await supabase.rpc("upload_completed_session", {
        p_device_id: syncDeviceId,
        p_group_id: record.groupId,
        p_worker_name: record.workerName,
        p_items: {
          production: record.production,
          deletedDuringSession: record.deletedDuringSession,
        },
        p_duration_seconds: record.durationSeconds,
        p_started_at: record.startTime,
        p_ended_at: record.endTime,
      });
      if (error) throw error;
      return true;
    } catch (e) {
      console.error("Sync: uploadCompletedSessionRecord failed", e);
      return false;
    }
  },

  // Called on app launch: uploads any local session logs that never made it to
  // Supabase (e.g. the whole session ran while offline).
  retryUnsyncedSessions: async (syncDeviceId) => {
    if (!syncDeviceId) return;
    try {
      const logs = await StorageService.loadSessionLogs();
      const unsynced = logs.filter((log) => !log.synced);
      for (const record of unsynced) {
        const success = await SyncService.uploadCompletedSessionRecord(
          syncDeviceId,
          record,
        );
        if (success) {
          await StorageService.markSessionSynced(record.sessionId);
        }
      }
    } catch (e) {
      console.error("Sync: retryUnsyncedSessions failed", e);
    }
  },
};
