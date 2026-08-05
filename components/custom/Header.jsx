// 'use client'
import React, { useState } from 'react'
import Image from 'next/image'
import {useContext} from 'react'
import { Button } from '../ui/button'
import { UserDetailContext } from '@/context/UserDetailContext'
import { useSidebar } from '../ui/sidebar'
import { usePathname } from 'next/navigation'
import { ActionContext } from '@/context/ActionContext'
import { LucideDownload, Rocket } from 'lucide-react'
import Link from 'next/link'
import SignInDialog from './SignInDialog'

const Header = () => {
  const {userDetail,setUserDetail} = useContext(UserDetailContext)
  const {toggleSidebar}=useSidebar()
  const {action,setAction}=useContext(ActionContext)
  const path=usePathname()
  const [openDialog, setOpenDialog] = useState(false)
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_AUTH_CLIENT_ID_KEY

  const onActionBtn=(action)=>{
      setAction({
        actionType:action,
        timestamps:Date.now()
      })
  }

  return (
    <div className='p-4 flex justify-between items-center'>
      <Link href={'/'}>
        <Image src="/logo.svg" alt="VIISEVEN Logo" width={140} height={40} className="h-10 w-auto" priority />
      </Link>
        {!userDetail?.name ? (
          <div className='flex gap-2'>
            <Button variant='outline' onClick={() => setOpenDialog(true)} className='cursor-pointer' disabled={!googleClientId}>Sign In</Button>
            <Button onClick={() => setOpenDialog(true)} className='cursor-pointer' disabled={!googleClientId}>Get Started</Button>
          </div>
        ) : (
          <div className='flex gap-2 items-center'>
            {path?.includes('workspace') && (
              <>
                <Button variant='ghost' onClick={()=>onActionBtn('export')} ><LucideDownload/>Export </Button>
                <Button onClick={()=>onActionBtn('deploy')} className="bg-blue-500 text-white hover:bg-blue-600" > <Rocket/>Deploy </Button>
              </>
            )}
            {userDetail?.picture && (
              <Image src={userDetail.picture} alt='user' width={30} height={30} className='rounded-full w-[30px] cursor-pointer' onClick={toggleSidebar} />
            )}
          </div>
        )}
      {googleClientId ? <SignInDialog openDialog={openDialog} closeDialog={setOpenDialog} /> : null}
    </div>
  )
}

export default Header