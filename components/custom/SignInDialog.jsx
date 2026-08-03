import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import Lookup from '@/data/Lookup'
import { Button } from '../ui/button'
import { useGoogleLogin } from '@react-oauth/google'
import axios from 'axios'
import { UserDetailContext } from '@/context/UserDetailContext'
import { useContext } from 'react'
import { toast } from 'sonner'
import { useMutation, useConvex } from 'convex/react'
import { api } from '@/convex/_generated/api'
import uuid4 from 'uuid4'

const GoogleSignInContent = ({ closeDialog }) => {
    const { userDetail, setUserDetail } = useContext(UserDetailContext)
    const createUser = useMutation(api.users.createUser)
    const convex = useConvex()

    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {


            const userInfo = await axios.get(
                'https://www.googleapis.com/oauth2/v3/userinfo',
                { headers: { Authorization: 'Bearer ' + tokenResponse?.access_token } },
            );


            const user = userInfo.data

            // Create or find user in Convex DB
            try {
                await createUser({
                    name: user?.name,
                    email: user?.email,
                    picture: user?.picture,
                    uid: uuid4(),
                })

                // Fetch the full user record (with Convex _id) from the DB
                const dbUser = await convex.query(api.users.getUsers, {
                    email: user?.email,
                })

                const activeUser = {
                    name: dbUser?.name || user?.name,
                    email: dbUser?.email || user?.email,
                    picture: dbUser?.picture || user?.picture,
                    token: dbUser?.token ?? 50000,
                    _id: dbUser?._id,
                }



                if (typeof window !== 'undefined') {
                    localStorage.setItem('user', JSON.stringify(activeUser))
                }

                setUserDetail(activeUser)
                closeDialog(false)
            } catch (error) {
                console.error('Error syncing user to Convex:', error)
                toast.error('Failed to sync user account. Please try again.')
            }
        },
        onError: errorResponse => console.log(errorResponse),
    });

    return (
        <div className='flex flex-col justify-center gap-3'>
            <h2 className='font-bold text-center text-2xl text-white'>{Lookup.SIGNIN_HEADING}</h2>
            <p className='mt-2 text-center text-muted-foreground'>{Lookup.SIGNIN_SUBHEADING}</p>
            <Button className='bg-blue-500 text-white hover:bg-blue-400 mt-3' onClick={googleLogin}>Sign In with Google</Button>
            <p className='text-sm text-muted-foreground text-center'>{Lookup?.SIGNIn_AGREEMENT_TEXT}</p>
        </div>
    )
}

const SignInDialog = ({ openDialog, closeDialog }) => {
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_AUTH_CLIENT_ID_KEY

    return (
        <Dialog open={openDialog} onOpenChange={closeDialog}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle></DialogTitle>
                    {googleClientId ? (
                        <GoogleSignInContent closeDialog={closeDialog} />
                    ) : (
                        <div className='flex flex-col justify-center gap-3'>
                            <h2 className='font-bold text-center text-2xl text-white'>{Lookup.SIGNIN_HEADING}</h2>
                            <p className='mt-2 text-center text-muted-foreground'>Google sign-in is not configured in this environment.</p>
                            <p className='text-sm text-muted-foreground text-center'>{Lookup?.SIGNIn_AGREEMENT_TEXT}</p>
                        </div>
                    )}
                </DialogHeader>
            </DialogContent>
        </Dialog>
    )
}

export default SignInDialog