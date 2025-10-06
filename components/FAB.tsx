'use client'

import { Plus } from 'lucide-react'
import Link from 'next/link'

export default function FAB() {
  return (
    <Link
      href="/session/start"
      className="fixed bottom-20 right-4 w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-colors z-40"
    >
      <Plus className="w-8 h-8 text-white" />
    </Link>
  )
}
