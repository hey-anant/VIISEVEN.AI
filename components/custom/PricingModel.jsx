import Lookup from '@/data/Lookup'
import React from 'react'
import { Button } from '../ui/button'
import { toast } from 'sonner'

const PricingModel = () => {
  return (
    <div className='mt-2 text-white  grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2' >
        {Lookup.PRICING_OPTIONS.map((pricing,index)=>(
            <div className='border p-4 flex flex-col ' key={index}>
                <h2 className='font-bold text-2xl'>{pricing.name}</h2>
                <h2 className='font-medium text-lg' >{pricing.tokens}</h2>
                <p className='text-gray-400' > {pricing.desc} </p>

                <h2 className='font-bold text-4xl text-center mt-6' >{pricing.price} </h2>
                <Button onClick={() => toast.info(`${pricing.name} plan — payment integration coming soon!`)}>Upgrade to {pricing.name} </Button>
            </div>
        ))}
    </div>
  )
}

export default PricingModel