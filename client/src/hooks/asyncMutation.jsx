import { useState } from "react"
import toast from "react-hot-toast"

const useAsyncMutation = (mutationHook) => {
    const [data, setData] = useState(null)
    const [mutate, { isLoading }] = mutationHook()

    const execMutation = async (toastMessage, ...args) => {
        const toastId = isLoading && toastMessage && toast.loading(toastMessage || 'Updating data...')
        try {
            const res = await mutate(...args).unwrap() // Use .unwrap() to handle the promise
            if (res.data) {
                setData(res.data)
                toastMessage && toast.success(res.message || 'Updated data successfully', { id: toastId })
                return res.data // Return the data
            } else {
                toast.error(res?.error?.data?.message || 'Something went wrong', { id: toastId })
                return null
            }
        } catch (error) {
            toast.error(error.message || 'Something went wrong', { id: toastId })
            return null
        }
    }
    return [execMutation, { isLoading, data }]
}

export default useAsyncMutation