import React, { useState, useContext } from 'react'
import { Button } from '../ui/button'
import { UserDetailContext } from '@/context/UserDetailContext'
import { useSidebar } from '../ui/sidebar'
import { usePathname } from 'next/navigation'
import { ActionContext } from '@/context/ActionContext'
import { LucideDownload, Rocket, UserCircle } from 'lucide-react'
import SignInDialog from './SignInDialog'
import Logo from './Logo'
import Image from 'next/image'

const Header = () => {
  const { userDetail } = useContext(UserDetailContext)
  const { toggleSidebar } = useSidebar()
  const { setAction } = useContext(ActionContext)
  const path = usePathname()
  const [openDialog, setOpenDialog] = useState(false)

  const onActionBtn = (action) => {
    setAction({
      actionType: action,
      timestamps: Date.now()
    })
  }

  return (
    <header className="px-6 py-4 flex justify-between items-center bg-background/80 backdrop-blur-md sticky top-0 z-40">
      <Logo />
      {!userDetail?.name ? (
        <div className="flex items-center gap-4">
          <button
            onClick={() => setOpenDialog(true)}
            className="text-sm font-medium text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            Sign in
          </button>
          <button
            onClick={() => setOpenDialog(true)}
            className="bg-[#0070f3] hover:bg-[#0060df] text-white font-medium text-sm px-4 py-2 rounded-xl transition-all shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer"
          >
            Get started
          </button>
        </div>
      ) : (
        <div className="flex gap-2 items-center">
          {path?.includes('workspace') && (
            <>
              <Button variant="ghost" size="sm" onClick={() => onActionBtn('export')} className="text-gray-300 hover:text-white">
                <LucideDownload className="w-4 h-4 mr-1.5" /> Export
              </Button>
              <Button size="sm" onClick={() => onActionBtn('deploy')} className="bg-[#0070f3] text-white hover:bg-[#0060df] rounded-lg">
                <Rocket className="w-4 h-4 mr-1.5" /> Deploy
              </Button>
            </>
          )}
          {userDetail?.picture ? (
            <Image
              src={userDetail.picture}
              alt="user"
              width={32}
              height={32}
              className="rounded-full w-8 h-8 cursor-pointer ring-1 ring-white/20 hover:ring-white/50 transition-all"
              onClick={toggleSidebar}
            />
          ) : (
            <button onClick={toggleSidebar} className="cursor-pointer">
              <UserCircle size={30} className="text-gray-400 hover:text-white transition-colors" />
            </button>
          )}
        </div>
      )}
      <SignInDialog openDialog={openDialog} closeDialog={setOpenDialog} />
    </header>
  )
}

export default Header