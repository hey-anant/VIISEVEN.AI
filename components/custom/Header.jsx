import React, { useState, useContext } from 'react'
import { Button } from '../ui/button'
import { UserDetailContext } from '@/context/UserDetailContext'
import { useSidebar } from '../ui/sidebar'
import { usePathname } from 'next/navigation'
import { ActionContext } from '@/context/ActionContext'
import { LucideDownload, Rocket, UserCircle, Github } from 'lucide-react'
import SignInDialog from './SignInDialog'
import GitHubPushDialog from './GitHubPushDialog'
import Logo from './Logo'
import Image from 'next/image'

const Header = () => {
  const { userDetail } = useContext(UserDetailContext)
  const { toggleSidebar } = useSidebar()
  const { setAction } = useContext(ActionContext)
  const path = usePathname()
  const [openDialog, setOpenDialog] = useState(false)
  const [openGitHubPush, setOpenGitHubPush] = useState(false)

  const onActionBtn = (action) => {
    setAction({
      actionType: action,
      timestamps: Date.now()
    })
  }

  return (
    <header className="px-6 py-4 flex justify-between items-center bg-background/80 backdrop-blur-md border-b border-border/40 sticky top-0 z-40">
      <Logo />
      {!userDetail?.name ? (
        <div className="flex items-center gap-4">
          <button
            onClick={() => setOpenDialog(true)}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpenGitHubPush(true)}
                className="bg-[#24292e] text-white hover:bg-[#2f363d] border-transparent rounded-lg cursor-pointer"
                title="Push project directly to GitHub"
              >
                <Github className="w-4 h-4 mr-1.5" /> Push to GitHub
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onActionBtn('export')}
                className="text-muted-foreground hover:text-foreground"
              >
                <LucideDownload className="w-4 h-4 mr-1.5" /> Export
              </Button>
              <Button
                size="sm"
                onClick={() => onActionBtn('deploy')}
                className="bg-[#0070f3] text-white hover:bg-[#0060df] rounded-lg shadow-sm"
              >
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
              className="rounded-full w-8 h-8 cursor-pointer ring-1 ring-border hover:ring-foreground/50 transition-all"
              onClick={toggleSidebar}
            />
          ) : (
            <button onClick={toggleSidebar} className="cursor-pointer">
              <UserCircle size={30} className="text-muted-foreground hover:text-foreground transition-colors" />
            </button>
          )}
        </div>
      )}
      <SignInDialog openDialog={openDialog} closeDialog={setOpenDialog} />
      <GitHubPushDialog
        open={openGitHubPush}
        onOpenChange={setOpenGitHubPush}
        openSignIn={setOpenDialog}
      />
    </header>
  )
}

export default Header
