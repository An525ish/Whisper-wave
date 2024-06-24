import { useState } from "react"
import toast from "react-hot-toast"

const useAsyncMutation = (mutationHook) => {
    const [data, setData] = useState('')
    const [mutate, { isLoading }] = mutationHook()

    const execMutation = async (toastMessage, ...args) => {
        const toastId = isLoading && toast.loading(toastMessage || 'Updating data...')
        try {
            const res = await mutate(...args)
            if (res.data) {
                setData(res.data.data)
                toast.success(res.data.message || 'Updated data successfully', { id: toastId })
            } else {
                toast.error(res?.error?.data?.message || 'Something went wrong', { id: toastId })
            }
        } catch (error) {
            toast.error(error.message || 'Something went wrong', { id: toastId })
        }
    }
    return [execMutation, isLoading, data]
}

export default useAsyncMutation;