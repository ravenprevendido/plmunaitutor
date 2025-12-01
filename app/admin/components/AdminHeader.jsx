import { SidebarTrigger } from '@/components/ui/sidebar'
import React, { useState } from 'react'

const AdminHeader = () => {
    const [showNotif, setShowNotif] = useState(false);

  return (
    <div>
      <SidebarTrigger/>
    </div>
  )
}

export default AdminHeader
