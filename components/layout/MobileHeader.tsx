'use client'

import { useState } from 'react'
import { Menu, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import Sidebar from '@/components/layout/Sidebar'

export default function MobileHeader() {
  const [open, setOpen] = useState(false)

  return (
    <div className="md:hidden flex items-center justify-between p-4 bg-sidebar border-b border-sidebar-border">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary shadow-md shadow-primary/30 shrink-0">
          <Building2 className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-sm text-sidebar-foreground">Rezende & Vidal</span>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="text-sidebar-foreground">
            <Menu className="w-6 h-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-[80vw] max-w-[280px] border-none">
          <Sidebar className="w-full" />
        </SheetContent>
      </Sheet>
    </div>
  )
}
