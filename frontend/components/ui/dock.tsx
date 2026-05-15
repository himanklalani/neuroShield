"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { motion } from "framer-motion"

interface DockProps {
  className?: string
  items: {
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
    label: string
    onClick?: () => void
  }[]
}

export default function Dock({ items, className }: DockProps) {
  const [active, setActive] = React.useState<string | null>(null)
  const [hovered, setHovered] = React.useState<number | null>(null)

  return (
    <div className={cn("flex items-center justify-center w-full py-6", className)}>
      <motion.div
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className={cn(
          "flex items-end gap-4 px-6 py-3 rounded-3xl pointer-events-auto",
          "border shadow-2xl"
        )}
        style={{
          transform: "perspective(600px) rotateX(10deg)", // arc layout illusion
          background: "rgba(25, 61, 53, 0.95)", // Deep Forest Spruce shell
          backdropFilter: "blur(20px)",
          borderColor: "rgba(255, 255, 255, 0.15)",
          boxShadow: "0 20px 40px -10px rgba(25, 61, 53, 0.3)",
        }}
      >
        <TooltipProvider delayDuration={100}>
          {items.map((item, i) => {
            const isActive = active === item.label
            const isHovered = hovered === i

            return (
              <Tooltip key={item.label}>
                <TooltipTrigger asChild>
                  <motion.div
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(null)}
                    animate={{
                      scale: isHovered ? 1.25 : 1,
                      rotate: isHovered ? -5 : 0,
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    className="relative flex flex-col items-center"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "rounded-2xl relative h-12 w-12",
                        "transition-all duration-200",
                        isHovered && "shadow-lg"
                      )}
                      onClick={() => {
                        setActive(item.label)
                        item.onClick?.()
                      }}
                      style={{ 
                        cursor: "pointer", 
                        background: isHovered ? "rgba(255, 255, 255, 0.12)" : "transparent",
                        border: "none"
                      }}
                    >
                      <item.icon
                        className="h-6 w-6 transition-colors duration-200"
                        style={{
                          color: isActive ? "#ffffff" : isHovered ? "#ffffff" : "#CFCECA",
                          opacity: isActive || isHovered ? 1 : 0.75
                        }}
                      />
                      {/* Glowing ring effect inside Spruce Dock */}
                      {isHovered && (
                        <motion.span
                          layoutId="glow"
                          className="absolute inset-0 rounded-2xl border"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          style={{ borderColor: "#F7F6F2" }}
                        />
                      )}
                    </Button>

                    {/* Active indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="dot"
                        className="w-1.5 h-1.5 rounded-full mt-1 absolute -bottom-1"
                        style={{ background: "#F7F6F2", boxShadow: "0 0 8px #F7F6F2" }}
                      />
                    )}
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent 
                  side="top" 
                  className="text-xs px-3 py-1.5 rounded-md border" 
                  style={{ 
                    background: "var(--bg-surface)", 
                    color: "var(--text-primary)", 
                    borderColor: "var(--border-color)",
                    fontWeight: 600,
                    boxShadow: "0 4px 12px rgba(25, 61, 53, 0.1)"
                  }}
                >
                  {item.label}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </TooltipProvider>
      </motion.div>
    </div>
  )
}
