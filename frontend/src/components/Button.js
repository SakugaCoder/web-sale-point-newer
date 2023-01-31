import styled from "styled-components";



const StyledButton = styled.button`
    display: block;
    border: solid 1px transparent;
    border-radius: 60px;
    font-weight: 700;
    font-size: 18px;
    ${ props => props.big ? 'padding: 20px 15px;' : '    padding: 20px 15px;'}

    ${props => props.medium ?`
        text-transform: uppercase;
        padding: 15px 10px;
        font-size: 18px;
        border-radius: 5px;
        display: inline-block;
    ` : ''}

    ${props => props.ml ? 'margin-left: 5px;' : ''}

    &:hover{
        cursor: pointer;
        background-color: white;
        border-color: #000;
    }

`;

export default StyledButton;
