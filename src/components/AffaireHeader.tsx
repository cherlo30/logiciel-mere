'use client'
import { useState } from 'react'

type Props = {
  affaireNom: string
  dateLivraison: string
  onChange: (nom: string, date: string) => void
}

export default function AffaireHeader({ affaireNom, dateLivraison, onChange }: Props) {
  return (
    <div className="mb-6">
      <input
        type="text"
        value={affaireNom}
        onChange={(e) => onChange(e.target.value, dateLivraison)}
        placeholder="Nom de l’affaire"
        className="border p-2 mr-4"
      />
      <input
        type="date"
        value={dateLivraison}
        onChange={(e) => onChange(affaireNom, e.target.value)}
        className="border p-2"
      />
    </div>
  )
}
