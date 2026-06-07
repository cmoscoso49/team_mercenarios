import React from 'react'

export default function CrosshairLogo({ size = 32, color = '#52a852', dotColor = '#cc2222', className = '' }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 32 32"
      fill="none" xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Team Mercenarios"
    >
      <circle cx="16" cy="16" r="13" stroke={color} strokeWidth="1.5"/>
      <circle cx="16" cy="16" r="5" stroke={color} strokeWidth="1.5"/>
      <line x1="16" y1="2" x2="16" y2="9" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="16" y1="23" x2="16" y2="30" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="2" y1="16" x2="9" y2="16" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="23" y1="16" x2="30" y2="16" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="16" cy="16" r="2" fill={dotColor}/>
    </svg>
  )
}
