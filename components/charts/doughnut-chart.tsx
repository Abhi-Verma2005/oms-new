'use client'

import { useRef, useState, useEffect } from 'react'
import { useTheme } from 'next-themes'

import { chartColors } from '@/components/charts/chartjs-config'
import {
  Chart, DoughnutController, ArcElement, TimeScale, Tooltip,
} from 'chart.js'
import type { ChartData } from 'chart.js'
import 'chartjs-adapter-moment'

// Import utilities
import { getCssVariable } from '@/components/utils/utils'

Chart.register(DoughnutController, ArcElement, TimeScale, Tooltip)
Chart.overrides.doughnut.cutout = '80%'

interface DoughnutProps {
  data: ChartData
  width: number
  height: number
}

export default function DoughnutChart({
  data,
  width,
  height
}: DoughnutProps) {

  const [chart, setChart] = useState<Chart | null>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const legend = useRef<HTMLUListElement>(null)
  const { theme } = useTheme()
  const darkMode = theme === 'dark'
  const { tooltipTitleColor, tooltipBodyColor, tooltipBgColor, tooltipBorderColor } = chartColors 

  useEffect(() => {    
    const ctx = canvas.current
    if (!ctx) return
    
    const newChart = new Chart(ctx, {
      type: 'doughnut',
      data: data,
      options: {
        layout: {
          padding: {
            top: 4,
            bottom: 4,
            left: 8,
            right: 8,
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            titleColor: darkMode ? tooltipTitleColor.dark : tooltipTitleColor.light,
            bodyColor: darkMode ? tooltipBodyColor.dark : tooltipBodyColor.light,
            backgroundColor: darkMode ? tooltipBgColor.dark : tooltipBgColor.light,
            borderColor: darkMode ? tooltipBorderColor.dark : tooltipBorderColor.light,
          },             
        },
        interaction: {
          intersect: false,
          mode: 'nearest',
        },
        animation: {
          duration: 500,
        },
        maintainAspectRatio: false,
        resizeDelay: 200,
      },
      plugins: [{
        id: 'htmlLegend',
        afterUpdate(c, args, options) {
          const ul = legend.current
          if (!ul) return
          // Remove old legend items
          while (ul.firstChild) {
            ul.firstChild.remove()
          }
          // Reuse the built-in legendItems generator
          const items = c.options.plugins?.legend?.labels?.generateLabels?.(c)
            items?.forEach((item) => {
              const li = document.createElement('li')
              li.style.margin = '1.5px'
              // Button element
              const button = document.createElement('button')
              button.classList.add('bg-white', 'dark:bg-gray-700', 'text-gray-500', 'dark:text-gray-400', 'shadow-sm', 'rounded-full', 'px-2', 'py-1.5')
              button.style.opacity = item.hidden ? '.3' : ''
              button.style.fontSize = '14px'
              button.onclick = () => {
                c.toggleDataVisibility(item.index!)
                c.update()
              }
              // Color box
              const box = document.createElement('span')
              box.style.display = 'inline-block'
              box.style.width = '6px'
              box.style.height = '6px'
              box.style.backgroundColor = item.fillStyle as string
              box.style.borderRadius = '3px'
              box.style.marginRight = '3px'
              box.style.pointerEvents = 'none'
              // Label
              const label = document.createElement('span')
              label.style.display = 'inline-flex'
              label.style.alignItems = 'center'
              label.style.fontSize = '14px'
              const labelText = document.createTextNode(item.text)
              label.appendChild(labelText)
              li.appendChild(button)
              button.appendChild(box)
              button.appendChild(label)
              ul.appendChild(li)
            })
        },
      }],
    })
    setChart(newChart)
    return () => newChart.destroy()
  }, [])

  useEffect(() => {
    if (!chart) return

    if (darkMode) {
      chart.options.plugins!.tooltip!.titleColor = tooltipTitleColor.dark
      chart.options.plugins!.tooltip!.bodyColor = tooltipBodyColor.dark
      chart.options.plugins!.tooltip!.backgroundColor = tooltipBgColor.dark
      chart.options.plugins!.tooltip!.borderColor = tooltipBorderColor.dark
    } else {
      chart.options.plugins!.tooltip!.titleColor = tooltipTitleColor.light
      chart.options.plugins!.tooltip!.bodyColor = tooltipBodyColor.light
      chart.options.plugins!.tooltip!.backgroundColor = tooltipBgColor.light
      chart.options.plugins!.tooltip!.borderColor = tooltipBorderColor.light
    }
    chart.update('none')
  }, [theme])     

  return (
    <div className="grow flex flex-col">
      <div className="flex-shrink-0" style={{ height: `${height * 0.7}px` }}>
        <canvas ref={canvas} width={width} height={height}></canvas>
      </div>
      <div className="flex-1 px-2 pt-2 pb-2 flex items-center justify-center">
        <ul ref={legend} className="flex flex-wrap justify-center gap-1.5 text-xs"></ul>
      </div>
    </div>
  )
}