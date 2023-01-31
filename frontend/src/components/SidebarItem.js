import { FontAwesomeIcon  } from "@fortawesome/react-fontawesome";
import styled from "styled-components";
import { Link } from "react-router-dom";


const SidebarItemContainer = styled(Link)`
    // background-color: yellow;
    color: #000;
    text-decoration: none;
    padding: 10px;
    display: flex;
    justify-content: center;
    border-left: 4px solid rgba(0, 0, 0, 0.0);
    transition: all ease 0.2s;

    &:hover{
        background-color: #26C485;
        cursor: pointer;
        border-left-color: #000;
    }

    background: ${props => props.active ? '#26C485' : 'none'};
    border-left-color: ${props => props.active ? '#000' : 'none'};
`;

const SidebarItemContent = styled.div`
    max-width: 220px;
    width: 100%;
    display: flex;
    align-items: center;
`;

const SidebarItemIcon = styled.div`
    width: 30%;
`;

const SidebarItemText = styled.p`
    width: 40%;
    font-weight: 500;
    font-size: 18px;
`;

export default function SidebarItem(props){
    return(
        <SidebarItemContainer to={props.href} active={props.active}>
            <SidebarItemContent>
                <SidebarItemIcon>
                    <FontAwesomeIcon icon={ (props.icon) }  size='lg' />
                </SidebarItemIcon>

                <SidebarItemText>
                    { props.name }
                </SidebarItemText>
            </SidebarItemContent>
        </SidebarItemContainer>
    );
}