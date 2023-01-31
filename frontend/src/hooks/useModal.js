import { useState } from 'react';
export default function useModal(){
    const [modalState, setModalState] = useState({
        visible: false,
        content: null
    });

    const handleModalClose = () => {
        // console.log('closing modal');
        setModalState({visible: false, content: null})
    }

    return { modalState, setModalState, handleModalClose};
}