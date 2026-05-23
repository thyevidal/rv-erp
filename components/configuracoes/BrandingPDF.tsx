'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, Upload, Palette, FileText, X } from 'lucide-react'

interface Branding {
  nome_razao_social: string
  cnpj: string
  telefone: string
  logo_url: string
  cor_primaria: string
}

const DEFAULT_COLOR = '#3C3489'

// Converte hex → rgb para preview
function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return { r, g, b }
}

// Mistura cor com branco para gerar variantes
function lighten(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex)
  const mix = (c: number) => Math.round(c + (255 - c) * amount)
  const toHex = (n: number) => n.toString(16).padStart(2, '0')
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`
}

function isValidHex(hex: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(hex)
}

export default function BrandingPDF() {
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [orgId, setOrgId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const [branding, setBranding] = useState<Branding>({
    nome_razao_social: '',
    cnpj: '',
    telefone: '',
    logo_url: '',
    cor_primaria: DEFAULT_COLOR,
  })

  // Input hex separado para validar antes de aplicar
  const [hexInput, setHexInput] = useState(DEFAULT_COLOR)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
      if (!profile?.organization_id) return
      setOrgId(profile.organization_id)
      const { data: org } = await supabase.from('organizations').select('nome_razao_social, cnpj, telefone, logo_url, cor_primaria').eq('id', profile.organization_id).single()
      if (org) {
        const b: Branding = {
          nome_razao_social: org.nome_razao_social ?? '',
          cnpj: org.cnpj ?? '',
          telefone: org.telefone ?? '',
          logo_url: org.logo_url ?? '',
          cor_primaria: org.cor_primaria ?? DEFAULT_COLOR,
        }
        setBranding(b)
        setHexInput(b.cor_primaria)
      }
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function set(field: keyof Branding, value: string) {
    setBranding(prev => ({ ...prev, [field]: value }))
  }

  function handleHexChange(val: string) {
    setHexInput(val)
    if (isValidHex(val)) {
      set('cor_primaria', val)
    }
  }

  function handlePickerChange(val: string) {
    set('cor_primaria', val)
    setHexInput(val)
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !orgId) return
    if (!file.type.startsWith('image/')) { toast.error('Selecione uma imagem (PNG, JPG, SVG)'); return }
    if (file.size > 2 * 1024 * 1024) { toast.error('Imagem deve ter menos de 2MB'); return }

    setUploadingLogo(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${orgId}/logo.${ext}`
      const { error } = await supabase.storage.from('org-logos').upload(path, file, { upsert: true })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('org-logos').getPublicUrl(path)
      // Força cache bust
      const urlComCache = `${publicUrl}?t=${Date.now()}`
      set('logo_url', urlComCache)
      toast.success('Logo enviado!')
    } catch (err: any) {
      toast.error('Erro ao enviar logo: ' + err.message)
    } finally {
      setUploadingLogo(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleRemoveLogo() {
    if (!orgId) return
    // Remove do storage (tenta PNG e JPG)
    await supabase.storage.from('org-logos').remove([`${orgId}/logo.png`, `${orgId}/logo.jpg`, `${orgId}/logo.svg`, `${orgId}/logo.jpeg`])
    set('logo_url', '')
  }

  async function handleSave() {
    if (!orgId) return
    setSaving(true)
    try {
      const { error } = await supabase.from('organizations').update({
        nome_razao_social: branding.nome_razao_social || null,
        cnpj: branding.cnpj || null,
        telefone: branding.telefone || null,
        logo_url: branding.logo_url || null,
        cor_primaria: isValidHex(branding.cor_primaria) ? branding.cor_primaria : DEFAULT_COLOR,
      }).eq('id', orgId)
      if (error) throw error
      toast.success('Configurações de PDF salvas!')
    } catch (err: any) {
      toast.error('Erro ao salvar: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const cor = isValidHex(branding.cor_primaria) ? branding.cor_primaria : DEFAULT_COLOR
  const corClara = lighten(cor, 0.5)
  const corSuave = lighten(cor, 0.8)

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Personalização do PDF
        </CardTitle>
        <CardDescription>
          Seu logo, cor e dados aparecem no cabeçalho de todos os orçamentos exportados.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Logo */}
        <div className="space-y-2">
          <Label>Logo da empresa</Label>
          <div className="flex items-center gap-4">
            {branding.logo_url ? (
              <div className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={branding.logo_url}
                  alt="Logo"
                  className="h-14 w-auto max-w-[160px] object-contain border rounded-lg p-1 bg-white"
                />
                <button
                  onClick={handleRemoveLogo}
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="h-14 w-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/30 text-muted-foreground text-xs">
                sem logo
              </div>
            )}
            <div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              <Button type="button" variant="outline" size="sm" className="gap-2" disabled={uploadingLogo} onClick={() => fileRef.current?.click()}>
                {uploadingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {uploadingLogo ? 'Enviando...' : branding.logo_url ? 'Trocar logo' : 'Enviar logo'}
              </Button>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG ou SVG · máx 2MB</p>
            </div>
          </div>
        </div>

        {/* Cor principal */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Cor principal
          </Label>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Color picker nativo */}
            <div className="relative">
              <input
                type="color"
                value={cor}
                onChange={e => handlePickerChange(e.target.value)}
                className="w-10 h-10 rounded-lg border cursor-pointer p-0.5 bg-white"
              />
            </div>
            {/* Hex input */}
            <Input
              value={hexInput}
              onChange={e => handleHexChange(e.target.value)}
              placeholder="#3C3489"
              className="w-32 font-mono text-sm uppercase"
              maxLength={7}
            />
            {/* Preview das variantes */}
            <div className="flex items-center gap-1.5 ml-2">
              <div className="w-6 h-6 rounded" style={{ backgroundColor: cor }} title="Principal" />
              <div className="w-6 h-6 rounded" style={{ backgroundColor: corClara }} title="Clara" />
              <div className="w-6 h-6 rounded" style={{ backgroundColor: corSuave }} title="Suave" />
              <span className="text-xs text-muted-foreground ml-1">variantes geradas automaticamente</span>
            </div>
          </div>
        </div>

        {/* Dados da empresa */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="razao">Razão Social / Nome da empresa</Label>
            <Input
              id="razao"
              value={branding.nome_razao_social}
              onChange={e => set('nome_razao_social', e.target.value)}
              placeholder="Construtora Silva Ltda"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input
              id="cnpj"
              value={branding.cnpj}
              onChange={e => set('cnpj', e.target.value)}
              placeholder="00.000.000/0001-00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={branding.telefone}
              onChange={e => set('telefone', e.target.value)}
              placeholder="(84) 99999-9999"
            />
          </div>
        </div>

        {/* Preview mini */}
        <div className="rounded-lg border overflow-hidden">
          <div className="px-4 py-3 flex items-center gap-3" style={{ backgroundColor: cor }}>
            {branding.logo_url
              /* eslint-disable-next-line @next/next/no-img-element */
              ? <img src={branding.logo_url} alt="" className="h-8 w-auto object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
              : <div className="w-8 h-8 rounded bg-white/20 flex items-center justify-center text-white font-bold text-sm">G</div>
            }
            <div>
              <p className="text-white font-bold text-sm leading-tight">
                {branding.nome_razao_social || 'Sua Construtora'}
              </p>
              <p className="text-xs leading-tight" style={{ color: corSuave }}>
                {[branding.cnpj, branding.telefone].filter(Boolean).join(' · ') || 'CNPJ · Telefone'}
              </p>
            </div>
          </div>
          <div className="px-4 py-2 bg-muted/30 text-xs text-muted-foreground">
            Prévia do cabeçalho do PDF
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
          {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : 'Salvar configurações de PDF'}
        </Button>
      </CardContent>
    </Card>
  )
}
