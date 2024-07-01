import Modal from "../Modal"

const ConfirmationModal = ({ onClose, handleConfirmationModal }) => {

    return (
        <Modal onClose={onClose}>
            <div className="w-[25rem] border border-border bg-background-alt/80 rounded-2xl p-8">
                <p className="text-xl text-center">Are you sure you want to leave ?</p>
                <div className="flex gap-4 mt-6">
                    <button
                        className="border-2 border-green-light hover:scale-95 transition text-green rounded-2xl w-full py-1 px-4"
                        onClick={() => handleConfirmationModal({ accept: true })}
                    >
                        Yes
                    </button>
                    <button
                        className="border-2 border-red-light hover:scale-95 transition text-red  rounded-2xl w-full py-1 px-4"
                        onClick={() => handleConfirmationModal({ accept: false })}
                    >
                        No
                    </button>
                </div>
            </div>
        </Modal>
    )
}

export default ConfirmationModal