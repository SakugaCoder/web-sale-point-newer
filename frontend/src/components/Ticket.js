import styled from "styled-components";
import Button from "./Button";

import { getTotal, roundNumber } from '../utils/Operations';

const TicketContainer = styled.div`
    width: 48%;
    padding: 20px 20px 0px 20px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

`;

const TicketContent = styled.div`
    background: white;
    padding: 10px;
    border-radius: 10px;
    border: solid 1px #DAEFE7;
    max-height: 50vh;
    overflow-y: auto;
    h3{
        font-size: 40px;
        margin-bottom: 10px;
    }

    p{
        font-size: 30px;
        margin: 5px 0px;
    }
`;

const TicketButtons = styled.div`
`;

const TicketButton = styled(Button)`
    width: 100%;
    margin-top: 20px;
    border-radius: 60px;
`;

const Total = styled.div`
    font-size: 30px;
    margin-top: 20px;
`;

const StyledItem = styled.p`
    padding: 2px;
    &:hover, &:focus{
        background-color: tomato;
        border-radius: 8px;
    }
`;

export default function Ticket(props){

    return(
        <TicketContainer>
            <TicketContent id="ticket-content">
                    { props.items.map( (item, index) => 
                        <StyledItem key={index} onClick={ () => props.onClickItem(item) }>{ item.name } <strong>x</strong> { roundNumber(item.kg) } { item.venta_por } = <strong> ${ roundNumber(Number(item.price) * Number(item.kg)) }</strong></StyledItem>
                    )}
                    <br/>
            </TicketContent>
            <Total><strong>Total: </strong>$ { getTotal(props.items) }</Total>

            <TicketButtons>
                <TicketButton className="bg-primary" onClick={ props.payOrder }>COBRAR</TicketButton>
                { props.restrictedMode ? null : <TicketButton className="bg-blue" onClick={ () => props.openPaymentModal(true) }>FIAR NOTA</TicketButton> }
                <TicketButton className="bg-red" onClick={ props.cancelOrder }>CANCELAR</TicketButton>
            </TicketButtons>
        </TicketContainer>
    );
}