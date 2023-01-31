import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faDownload } from '@fortawesome/free-solid-svg-icons';

import { useState, useEffect} from 'react';


const StyledLabel = styled.label`
    & p{
        font-weight: 600;
        font-size: 26px;
        margin-bottom: 5px;
    }
`;
const StyledInput = styled.input`
    border: solid 2px #000;
    padding: 10px;
    border-radius: 20px;
    width: 100%;
    font-size: 26px;
    max-width: ${props => props.maxWidth ? props.maxWidth: '100%'};
`;

export default function Input(props){
    return(
        <StyledLabel>
            <p>{ props.label }</p>
            <StyledInput type={ props.type ? props.type: 'text'} max={ props.max ? props.max : ''} step={ props.step ? props.step : ''} placeholder={ props.placeholder} maxWidth={ props.maxWidth } name={ props.name } defaultValue={ props.defaultValue ? props.defaultValue : null} />
        </StyledLabel>
    );
}

export function InputFile(props){

    const [currentFilename, setCurrentFilename] = useState('');
    const fileTypes = ['image/png', 'image/jpg', 'image/jpeg'];

    const changeFilename = (evt) => {

        if(evt.target.files.length > 0){
            let file = evt.target.files[0];
            console.log(file);
            setCurrentFilename(file.name);
            /*    
            if(fileTypes.includes(file.type)){
                
                let fr = new FileReader()
                if(fr){
                    fr.readAsDataURL(file);
                }
    
                fr.onloadend = ()  => {
                    console.log(fr.result);
                    setCurrentUserImg(fr.result);
                }
                
            }
            else{
                alert('Tipo de archivo no permitido');
            }
            */
        }
        else{
            setCurrentFilename(<span style={ {border: 'solid 1px #000'} }><FontAwesomeIcon icon={faPlus}/> Agregar</span>);
        }
    }

    const handleOnChange = (evt) => {
        changeFilename(evt); 
        props.onChange(evt);
    }

    useEffect(() => {
        if(props.value){
            setCurrentFilename(props.value);
        }

        else{
            setCurrentFilename(<span style={ {border: 'Solid 1px #000', marginTop: 20, padding: 10, display: 'block', borderRadius: 10} }><FontAwesomeIcon icon={faPlus}/> Agregar</span>);
        }
    }, [])

    return(
        <div>
            <label>
                
                <div className='bg-acent inline-block text-white p-2 cursor-pointer'>{ props.value ? currentFilename.split('/')[currentFilename.split('/').length -1] :currentFilename} </div>
                <input type='file' name={props.name} placeholder={props.placeholder}  onChange={ handleOnChange } className='bg-gray-200 p-2 w-full hidden' />
            </label>
            {
                props.value ? 
                    <span><br/><a target='_blank' href={props.value} className='bg-primary inline-block text-white p-2 mt-2'><FontAwesomeIcon icon={faDownload} /> Descargar</a></span>
                :
                null
            }
        </div>
    );
}