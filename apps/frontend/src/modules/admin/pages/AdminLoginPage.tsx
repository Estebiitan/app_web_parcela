import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from '@/design-system'
import { hasAdminSession, loginAdmin, clearAdminSession } from '@/modules/admin/api/adminApi'
import { getApiErrorMessage } from '@/shared/api/http'

export function AdminLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (hasAdminSession()) {
    return <Navigate replace to="/panel-admin" />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const user = await loginAdmin(email.trim(), password)
      if (user.role !== 'admin') {
        clearAdminSession()
        setError('Esta cuenta no tiene permisos para entrar al panel.')
        return
      }

      navigate('/panel-admin', { replace: true })
    } catch (submitError) {
      setError(getApiErrorMessage(submitError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[rgb(var(--color-canvas))] px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(132,188,105,0.24),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(203,226,193,0.18),transparent_30%)]" />
      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-8 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-6 rounded-[2rem] border border-border-soft/70 bg-[linear-gradient(145deg,rgba(9,18,14,0.96),rgba(20,39,27,0.92)_56%,rgba(59,95,57,0.86))] p-8 text-white shadow-[0_2rem_5rem_rgba(0,0,0,0.3)] sm:p-10">
          <Badge className="border-white/12 bg-white/10 text-white">Panel personalizado</Badge>
          <div className="space-y-4">
            <h1 className="max-w-2xl font-display text-[clamp(2.8rem,2.1rem+2vw,4.8rem)] leading-[0.95]">
              Controla la parcela sin tocar el admin clasico.
            </h1>
            <p className="max-w-2xl text-base leading-8 text-white/74">
              Desde aqui podras ajustar precios, reglas del simulador, disponibilidad, galeria,
              cards de servicios y contenido publico, con una interfaz pensada para operar rapido y
              con claridad.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-4 backdrop-blur-sm">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/58">
                Precios
              </p>
              <p className="mt-2 text-sm leading-6 text-white/80">
                Tramos, extras, deposito y copy del simulador.
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-4 backdrop-blur-sm">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/58">
                Disponibilidad
              </p>
              <p className="mt-2 text-sm leading-6 text-white/80">
                Bloqueos visuales y fechas especiales desde un solo lugar.
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-4 backdrop-blur-sm">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/58">
                Galeria
              </p>
              <p className="mt-2 text-sm leading-6 text-white/80">
                Orden, textos, fotos destacadas y escenas publicas.
              </p>
            </div>
          </div>
        </div>

        <Card className="rounded-[2rem] border-border-soft/70 bg-panel/92 shadow-[0_1.6rem_4rem_rgba(0,0,0,0.16)]">
          <CardHeader className="gap-4">
            <Badge tone="accent">Acceso administrador</Badge>
            <CardTitle>Entra al panel</CardTitle>
            <CardDescription>
              Usa tu cuenta administrativa del backend para editar la experiencia publica.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-5" onSubmit={handleSubmit}>
              <Input
                autoComplete="email"
                id="admin-login-email"
                label="Correo"
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
              <Input
                autoComplete="current-password"
                id="admin-login-password"
                label="Contrasena"
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />

              {error ? (
                <div className="rounded-[1.35rem] border border-danger/22 bg-danger-soft px-4 py-4 text-sm leading-7 text-danger">
                  {error}
                </div>
              ) : null}

              <Button className="h-12 rounded-full px-6" disabled={isSubmitting} type="submit">
                {isSubmitting ? 'Entrando...' : 'Abrir panel'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
