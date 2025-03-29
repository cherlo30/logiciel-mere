'use client'

import { useState } from 'react'
import AffaireHeader from '@/components/AffaireHeader'
import FlowEditor from '@/components/FlowEditor'
import { ReactFlowProvider } from 'reactflow' // 👉 nécessaire pour éviter l’erreur Zustand

export default function Page() {
  const [nom, setNom] = useState('')
  const [date, setDate] = useState('')

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Édition de l’affaire</h1>
      <AffaireHeader
        affaireNom={nom}
        dateLivraison={date}
        onChange={(newNom, newDate) => {
          setNom(newNom)
          setDate(newDate)
        }}
      />

      {/* 👇 Wrapping FlowEditor with ReactFlowProvider */}
      <ReactFlowProvider>
        <FlowEditor />
      </ReactFlowProvider>
    </div>
  )
}
