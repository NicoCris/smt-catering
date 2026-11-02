import { useEffect, useState, useMemo } from 'react'
import {
  Users,
  UserPlus,
  Shield,
  ChefHat,
  Building2,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  Mail,
  Phone,
  Power,
} from 'lucide-react'

import { PageHeader } from '@/components/layout/AppShell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { StaffModal, type StaffItem } from './StaffModal'
import { ClientEditModal, type ClientItem } from './ClientEditModal'

export function UsersPage() {
  const currentAuthUser = useAuthStore((s) => s.user)
  const currentAuthRole = currentAuthUser?.role

  const [activeTab, setActiveTab] = useState<'staff' | 'clients'>('staff')
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'todos' | 'superadmin' | 'admin' | 'cocina'>('todos')

  const [staff, setStaff] = useState<StaffItem[]>([])
  const [clients, setClients] = useState<ClientItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Modals state
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffItem | null>(null)

  const [isClientModalOpen, setIsClientModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<ClientItem | null>(null)

  const reloadUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get<{ staff: StaffItem[]; clients: ClientItem[] }>('/api/users')
      setStaff(res.staff || [])
      setClients(res.clients || [])
    } catch (err: any) {
      setError(err.message || 'Error al cargar la lista de usuarios.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    api
      .get<{ staff: StaffItem[]; clients: ClientItem[] }>('/api/users')
      .then((res) => {
        if (active) {
          setStaff(res.staff || [])
          setClients(res.clients || [])
          setLoading(false)
        }
      })
      .catch((err: any) => {
        if (active) {
          setError(err.message || 'Error al cargar la lista de usuarios.')
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [])

  // Filtrado de staff
  const filteredStaff = useMemo(() => {
    return staff.filter((u) => {
      const matchesSearch =
        u.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesRole = roleFilter === 'todos' || u.rol === roleFilter
      return matchesSearch && matchesRole
    })
  }, [staff, searchTerm, roleFilter])

  // Filtrado de clientes
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const term = searchTerm.toLowerCase()
      return (
        c.razon_social.toLowerCase().includes(term) ||
        c.cuit.toLowerCase().includes(term) ||
        c.nombre_completo.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term)
      )
    })
  }, [clients, searchTerm])

  // Toggle rápido de estado activo/inactivo para staff
  const handleToggleStaffStatus = async (user: StaffItem) => {
    const newStatus = user.activo ? 0 : 1
    try {
      await api.patch(`/api/users/staff/${user.id_usuario}`, { activo: newStatus })
      setStaff((prev) =>
        prev.map((item) =>
          item.id_usuario === user.id_usuario ? { ...item, activo: newStatus } : item,
        ),
      )
    } catch (err: any) {
      alert(err.message || 'No se pudo cambiar el estado del usuario.')
    }
  }

  // Eliminar staff (solo superadmin)
  const handleDeleteStaff = async (user: StaffItem) => {
    if (!confirm(`¿Estás seguro de eliminar permanentemente a "${user.nombre_completo}"?`)) {
      return
    }

    try {
      await api.delete(`/api/users/staff/${user.id_usuario}`)
      setStaff((prev) => prev.filter((item) => item.id_usuario !== user.id_usuario))
    } catch (err: any) {
      alert(err.message || 'No se pudo eliminar el colaborador.')
    }
  }

  // Render badge de rol con estilos semánticos
  const renderRoleBadge = (rol: string) => {
    switch (rol) {
      case 'superadmin':
        return (
          <span className="inline-flex items-center gap-1 rounded-pill bg-purple-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:text-purple-300 border border-purple-500/20">
            <Shield className="w-3 h-3" />
            Superadmin
          </span>
        )
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 rounded-pill bg-sky-500/10 px-2.5 py-0.5 text-xs font-semibold text-sky-700 dark:text-sky-300 border border-sky-500/20">
            <Users className="w-3 h-3" />
            Administrador
          </span>
        )
      case 'cocina':
        return (
          <span className="inline-flex items-center gap-1 rounded-pill bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300 border border-amber-500/20">
            <ChefHat className="w-3 h-3" />
            Chef Cocina
          </span>
        )
      default:
        return <Badge variant="neutral">{rol}</Badge>
    }
  }

  return (
    <>
      <PageHeader
        title="Gestión de Usuarios"
        description="Supervisión de colaboradores internos y empresas clientes del sistema."
        actions={
          activeTab === 'staff' ? (
            <Button
              onClick={() => {
                setEditingStaff(null)
                setIsStaffModalOpen(true)
              }}
              className="gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Nuevo Colaborador
            </Button>
          ) : null
        }
      />

      {/* Grid de KPIs de usuarios */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border border-hairline bg-canvas p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-ink-mute">Staff Total</p>
              <p className="text-xl font-bold text-ink">{staff.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-hairline bg-canvas p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-ink-mute">Staff Activo</p>
              <p className="text-xl font-bold text-ink">{staff.filter((s) => s.activo).length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-hairline bg-canvas p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-ink-mute">Cocina</p>
              <p className="text-xl font-bold text-ink">{staff.filter((s) => s.rol === 'cocina').length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-hairline bg-canvas p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-ink-mute">Clientes B2B</p>
              <p className="text-xl font-bold text-ink">{clients.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs de navegación */}
      <div className="flex items-center justify-between border-b border-hairline mb-6 gap-4 flex-wrap">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('staff')}
            className={`pb-3 px-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'staff'
                ? 'border-primary text-primary'
                : 'border-transparent text-ink-mute hover:text-ink'
            }`}
          >
            <Users className="w-4 h-4" />
            Equipo Interno ({staff.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('clients')}
            className={`pb-3 px-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'clients'
                ? 'border-primary text-primary'
                : 'border-transparent text-ink-mute hover:text-ink'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Clientes Corporativos ({clients.length})
          </button>
        </div>

        {/* Barra de búsqueda y filtros */}
        <div className="flex items-center gap-2 mb-2">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
            <Input
              type="text"
              placeholder={activeTab === 'staff' ? 'Buscar por nombre o email…' : 'Buscar empresa, CUIT o contacto…'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          {activeTab === 'staff' && (
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="h-9 rounded-md border border-hairline bg-canvas px-2.5 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="todos">Todos los roles</option>
              <option value="superadmin">Superadmin</option>
              <option value="admin">Administrador</option>
              <option value="cocina">Chef Cocina</option>
            </select>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-6 rounded-lg bg-state-danger-bg p-4 text-sm text-state-danger border border-state-danger/20">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="py-16 text-center text-sm text-ink-mute">
          Cargando directorio de usuarios…
        </div>
      ) : activeTab === 'staff' ? (
        /* TAB 1: STAFF INTERNO */
        filteredStaff.length === 0 ? (
          <div className="py-12 text-center text-ink-mute rounded-xl border border-hairline bg-canvas">
            No se encontraron miembros de staff con los criterios de búsqueda.
          </div>
        ) : (
          <div className="rounded-xl border border-hairline bg-canvas overflow-hidden shadow-sm">
            <Table>
              <THead>
                <TR>
                  <TH>Colaborador</TH>
                  <TH>Rol Asignado</TH>
                  <TH>Estado</TH>
                  <TH className="text-right">Acciones</TH>
                </TR>
              </THead>
              <TBody>
                {filteredStaff.map((user) => {
                  const isCurrentLogged = currentAuthUser?.id === user.id_usuario
                  const isUserActive = Boolean(user.activo)

                  return (
                    <TR key={user.id_usuario}>
                      <TD>
                        <div className="flex flex-col">
                          <span className="font-medium text-ink flex items-center gap-1.5">
                            {user.nombre_completo}
                            {isCurrentLogged && (
                              <span className="text-[10px] text-primary bg-primary-subdued px-1.5 py-0.2 rounded font-normal">
                                Tú
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-ink-mute flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </span>
                        </div>
                      </TD>
                      <TD>{renderRoleBadge(user.rol)}</TD>
                      <TD>
                        <button
                          type="button"
                          onClick={() => handleToggleStaffStatus(user)}
                          disabled={isCurrentLogged}
                          className={`inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-medium transition-colors ${
                            isUserActive
                              ? 'bg-state-ok-bg text-state-ok hover:bg-state-ok-bg/80'
                              : 'bg-state-neutral-bg text-state-neutral hover:bg-state-neutral-bg/80'
                          } ${isCurrentLogged ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                          title={isCurrentLogged ? 'No puedes desactivarte a ti mismo' : 'Clic para cambiar estado'}
                        >
                          <Power className="w-3 h-3" />
                          {isUserActive ? 'Activo' : 'Inactivo'}
                        </button>
                      </TD>
                      <TD className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingStaff(user)
                              setIsStaffModalOpen(true)
                            }}
                            className="p-1.5 rounded-md text-ink-mute hover:text-primary hover:bg-canvas-soft transition-colors"
                            title="Editar colaborador"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {currentAuthRole === 'superadmin' && !isCurrentLogged && (
                            <button
                              type="button"
                              onClick={() => handleDeleteStaff(user)}
                              className="p-1.5 rounded-md text-ink-mute hover:text-state-danger hover:bg-canvas-soft transition-colors"
                              title="Eliminar colaborador"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </TD>
                    </TR>
                  )
                })}
              </TBody>
            </Table>
          </div>
        )
      ) : (
        /* TAB 2: CLIENTES B2B */
        filteredClients.length === 0 ? (
          <div className="py-12 text-center text-ink-mute rounded-xl border border-hairline bg-canvas">
            No se encontraron empresas clientes registradas.
          </div>
        ) : (
          <div className="rounded-xl border border-hairline bg-canvas overflow-hidden shadow-sm">
            <Table>
              <THead>
                <TR>
                  <TH>Empresa (B2B)</TH>
                  <TH>Contacto Responsable</TH>
                  <TH>Datos de Contacto</TH>
                  <TH>Dirección Legal</TH>
                  <TH className="text-right">Acciones</TH>
                </TR>
              </THead>
              <TBody>
                {filteredClients.map((client) => (
                  <TR key={client.id_cliente}>
                    <TD>
                      <div className="flex flex-col">
                        <span className="font-medium text-ink">{client.razon_social}</span>
                        <span className="text-xs text-ink-mute font-mono">CUIT: {client.cuit}</span>
                      </div>
                    </TD>
                    <TD>
                      <div className="flex flex-col">
                        <span className="text-ink">{client.nombre_completo}</span>
                        {client.cargo_responsable && (
                          <span className="text-xs text-ink-mute">{client.cargo_responsable}</span>
                        )}
                      </div>
                    </TD>
                    <TD>
                      <div className="flex flex-col text-xs">
                        <span className="text-ink flex items-center gap-1">
                          <Mail className="w-3 h-3 text-ink-mute" />
                          {client.email}
                        </span>
                        {client.telefono && (
                          <span className="text-ink-mute flex items-center gap-1">
                            <Phone className="w-3 h-3 text-ink-mute" />
                            {client.telefono}
                          </span>
                        )}
                      </div>
                    </TD>
                    <TD>
                      <span className="text-xs text-ink-mute line-clamp-2">
                        {client.direccion_legal || '—'}
                      </span>
                    </TD>
                    <TD className="text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingClient(client)
                          setIsClientModalOpen(true)
                        }}
                        className="p-1.5 rounded-md text-ink-mute hover:text-primary hover:bg-canvas-soft transition-colors"
                        title="Editar datos del cliente"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        )
      )}

      {/* Modal para Crear / Editar Staff */}
      {isStaffModalOpen && (
        <StaffModal
          key={editingStaff ? `staff-${editingStaff.id_usuario}` : 'staff-new'}
          isOpen={isStaffModalOpen}
          onClose={() => setIsStaffModalOpen(false)}
          onSuccess={reloadUsers}
          editingUser={editingStaff}
          currentAuthRole={currentAuthRole}
        />
      )}

      {/* Modal para Editar Cliente */}
      {isClientModalOpen && (
        <ClientEditModal
          key={editingClient ? `client-${editingClient.id_cliente}` : 'client-new'}
          isOpen={isClientModalOpen}
          onClose={() => setIsClientModalOpen(false)}
          onSuccess={reloadUsers}
          client={editingClient}
        />
      )}
    </>
  )
}
