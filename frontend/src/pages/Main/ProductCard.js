import styled from "styled-components";

import { roundNumber } from "../../utils/Operations";

const ProductCardStyled = styled.div`
    border: solid 1px #CFDFE3 ;
    border-radius: 20px;
    display: flex;
    flex-direction: column;
    padding: 5px;
    transition: all ease 0.2s;
    &:hover{
        border-color: #000;
        cursor: pointer;
    }
`;

const ProductCardImage = styled.img`
    max-width: 70%;
    margin: auto;
`;

const ProductCardPrice = styled.div`
    font-weight: 600;
    font-size: 22px;
    text-align: center;
    margin-top: 5px;
`;

const ProductCardName = styled.div`
    font-weight: 800;
    font-size: 20px;
    text-align: center;
    margin-top: 5px;
`;

export default function ProductCard(props){
    return(
        <ProductCardStyled onClick={ () => props.handleOnClick(props) }>
            <ProductCardImage src={props.img} />
            <ProductCardName>
                { props.name }
            </ProductCardName>
            <ProductCardPrice>
                $ { roundNumber(props.price) }
            </ProductCardPrice>
        </ProductCardStyled>
    );
}