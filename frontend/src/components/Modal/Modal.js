
import {
    faTimesCircle
} from '@fortawesome/free-solid-svg-icons';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import "./Modal.css";
export default function Modal(props){
    return(
        <div className={`modal__container ${props.visible ? 'block': 'hidden'}`}>
            <div className='modal__content'>
                <div className='modal__header'>
                    {/* <h2 className='modal-title'>{props.title}</h2> */}<button className='ml-5' type="button" onClick={props.handleModalClose}><FontAwesomeIcon icon={faTimesCircle} size='2x' /></button>
                </div>
                
                <div className='modal-body'>
                    {props.children}
                </div>
            </div>

            <div className='modal__bg' onClick={props.handleModalClose}></div>
        </div>
    );
}