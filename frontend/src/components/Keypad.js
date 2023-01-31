import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBackspace } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';

const KeypadContainer = styled.div`
    display: grid;
    max-width: 600px;
    margin: auto;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, 1fr);
    grid-column-gap: 10px;
    grid-row-gap: 10px;
`;

const KeypadNumber = styled.div`
    background-color: #DCDCDC;
    padding: 10px;
    font-weight: bold;
    font-size: 36px;
    text-align: center;
    &:hover{
        cursor: pointer;
    }

    &:active{
        background-color: #C8C8C8;
    }
`;

export default function Keypad(props){
    const keyPadItems= ['1', '2', '3', '4', '5', '6', '7', '8', '9', '<-', '0', '.'];

    const onClickKeyPadItem = char =>{
        console.log(char, props.currentNumber);
        if(char === '.'){
            if(!props.currentNumber.includes('.')){
                props.setCurrentNumber(props.currentNumber + char);
            }
        }

        else{
            if(char !== 'C' && char !== '<-'){
                if(props.currentNumber === ''){                            
                    if(char !== '0'){
                        props.setCurrentNumber(char);
                    }
                }
                else{
                    props.setCurrentNumber(props.currentNumber + char);
                }
            }
    
            else if(char === 'C'){
                props.setCurrentNumber('');
            }
    
            else if(char === '<-'){
                console.log('Hey llegamos aqui')
                if(props.currentNumber.length >= 1){
                    console.log('si es correcto');
                    props.setCurrentNumber( props.currentNumber.substring(0, props.currentNumber.length - 1), true);
                }
            }
        }
    }
    return (
        <>
            <KeypadContainer>
                { keyPadItems.map( item => <KeypadNumber onClick={ () => onClickKeyPadItem(item) }> { item } </KeypadNumber>) }
            </KeypadContainer>
        </>
    );
}