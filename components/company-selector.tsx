"use client"

import { Check, ChevronsUpDown } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const companies = [
  {
    value: "mcd",
    label: "McDonald's (MCD)",
  },
  {
    value: "yum",
    label: "Yum! Brands (YUM)",
  },
  {
    value: "wen",
    label: "Wendy's (WEN)",
  },
  {
    value: "pzza",
    label: "Papa John's (PZZA)",
  },
  {
    value: "qsr",
    label: "Restaurant Brands Int. (QSR)",
  },
  {
    value: "dnkn",
    label: "Dunkin' Brands",
  },
  {
    value: "sbux",
    label: "Starbucks (SBUX)",
  },
]

export function CompanySelector() {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-[250px] justify-between">
          {value ? companies.find((company) => company.value === value)?.label : "Sélectionner une entreprise..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0">
        <Command>
          <CommandInput placeholder="Rechercher une entreprise..." />
          <CommandList>
            <CommandEmpty>Aucune entreprise trouvée.</CommandEmpty>
            <CommandGroup>
              {companies.map((company) => (
                <CommandItem
                  key={company.value}
                  value={company.value}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === company.value ? "opacity-100" : "opacity-0")} />
                  {company.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
