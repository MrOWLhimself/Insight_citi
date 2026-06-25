'use client'
import { createBrowserClient } from '@supabase/ssr'
export const supabase = createBrowserClient(
  'https://uysipsegizbixwgvwdzl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5c2lwc2VnaXpiaXh3Z3Z3ZHpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5ODQ2OTEsImV4cCI6MjA5NzU2MDY5MX0.A5i2qKAtC_sPmTyMjoEIPBUmok8UGGHHswQXkaTC6Io'
)