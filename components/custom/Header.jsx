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
    <div className='p-4 flex justify-between items-center'>
      <Logo />
        {!userDetail?.name ? (
          <div className='flex gap-2'>
            <Button variant='outline' onClick={() => setOpenDialog(true)} className='cursor-pointer'>Sign In</Button>
            <Button onClick={() => setOpenDialog(true)} className='cursor-pointer'>Get Started</Button>
          </div>
        ) : (
          <div className='flex gap-2 items-center'>
            {path?.includes('workspace') && (
              <>
                <Button variant='ghost' onClick={() => onActionBtn('export')} ><LucideDownload/>Export </Button>
                <Button onClick={() => onActionBtn('deploy')} className="bg-blue-500 text-white hover:bg-blue-600" > <Rocket/>Deploy </Button>
              </>
            )}
            {userDetail?.picture ? (
              <Image src={userDetail.picture} alt='user' width={30} height={30} className='rounded-full w-[30px] cursor-pointer' onClick={toggleSidebar} />
            ) : (
              <button onClick={toggleSidebar} className='cursor-pointer'>
                <UserCircle size={30} className='text-muted-foreground hover:text-foreground transition-colors' />
              </button>
            )}
          </div>
        )}
      <SignInDialog openDialog={openDialog} closeDialog={setOpenDialog} />
    </div>
  )
}

export default Header