import { ArrowRight } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { LogoKlippFlow } from '@/shared/ui/LogoKlippFlow'

export function CodigoPage() {
  const navegar = useNavigate()
  const [codigo, setCodigo] = useState('')
  const normalizado = codigo.replace(/\s+/g, '').toUpperCase()

  function continuar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!normalizado) return
    navegar(`/b/${encodeURIComponent(normalizado)}`)
  }

  return (
    <main className="screen flex min-h-[calc(100dvh-48px)] flex-col max-[899px]:min-h-dvh">
      <div className="mx-auto flex w-full max-w-[420px] flex-col">
        <LogoKlippFlow tamano={44} />

        <h1 className="type-public-title mt-8">Reserva tu cita</h1>
        <p className="type-form mt-4 text-secondary">
          Escribe el código que te compartió tu barbero.
        </p>

        <form onSubmit={continuar} className="mt-10 flex flex-col gap-6" noValidate>
          <Input
            etiqueta="Código del barbero"
            name="codigo"
            value={codigo}
            onChange={(evento) =>
              setCodigo(evento.target.value.replace(/\s+/g, '').toUpperCase())
            }
            autoComplete="off"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            maxLength={20}
            placeholder="Ej. BARB-0001"
          />

          <Button type="submit" className="w-full" disabled={!normalizado}>
            Continuar
            <ArrowRight aria-hidden="true" size={16} strokeWidth={1.6} />
          </Button>
        </form>
      </div>
    </main>
  )
}
