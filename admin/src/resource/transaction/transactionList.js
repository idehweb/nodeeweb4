import {
  BooleanField,
  Datagrid,
  Filter,
  FunctionField,
  NumberField,
  SearchInput,
  SimpleShowLayout,
  TextField,
  EditButton,
  SelectField,
  SimpleList,
  useTranslate
} from "react-admin";
import {Chip, Divider, Tab, Tabs, useMediaQuery} from '@mui/material';

import { dateFormat } from "@/functions";
import { List, StatusField,PaymentStatus ,TransactionPaymentStatusField, SimpleForm} from "@/components";
import { useSelector } from "react-redux";
// import Transactions from "../../../../main/src/client/views/Transactions";


export const transactionList = (props) => {
  const translate = useTranslate();
  const PaymentStatuses = PaymentStatus();
  console.log('PaymentStatus',PaymentStatuses);
  const themeData = useSelector((st) => st.themeData);
  const isSmall = useMediaQuery(theme => theme.breakpoints.down('sm'));

  return (
    <List {...props} filters={
      <Filter {...props}>
        <SearchInput source="search" alwaysOn/>
      </Filter>
    }>
    {isSmall ? (<>
      <SimpleList
                        primaryText={record => <div>
                          <div className={"d-dfgfd"}>
                    <span className={'gap-10'}>        <SelectField source="statusCode" choices={PaymentStatuses}
        label={translate("resources.transaction.statusCode")} optionText={<TransactionPaymentStatusField />}
        />
                    </span>
                              <span>#{record?.order?.orderNumber}</span>
                          </div>
                          <div>{record?.Authority}</div>
                          <div>{record?.customer?.phoneNumber}</div>

                      </div>}
                      secondaryText={record => <div className={'d-dfgfd'}><span>{dateFormat(record.createdAt)}</span><span>{record?.amount?.toString()?.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' ' + translate(themeData.currency)}</span></div>}
                      // tertiaryText={record => record?.amount?.toString()?.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' ' + t(themeData.currency)}
                      linkType={"edit"}
      />
    </>): (    
      <Datagrid>
        {/*<TextField source="id"/>*/}
        <TextField source="Authority" label={translate("resources.transaction.authority")}/>
        <FunctionField label={translate("resources.order.amount")}
                       render={record => {
                         return (record && record.amount && record.amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")+" "+translate(themeData.currency));
                       }}/>
        <TextField source="RefID" label={translate("resources.transaction.RefID")}/>

        {/*<NumberField source="amount" label={translate("resources.transaction.amount")}/>*/}
        <TextField source="method" label={translate("resources.transaction.gateway")}/>
        {/*<TextField source="orderNumber" label={translate("resources.transaction.orderNumber")}/>*/}

        <FunctionField label={translate("resources.transaction.orderNumber")}
                       render={record => {
                         if(!record || !record.order || !record.order.orderNumber){
                           return
                         }
                         return(
                           <div className='theDate'>

                             <a href={"/admin/#/order/" + record.order._id} target={"_blank"}>{record.order.orderNumber ? record.order.orderNumber : ''}</a>

                           </div>
                         )
                       }}/>

        <SelectField source="statusCode" choices={PaymentStatuses}
        label={translate("resources.transaction.statusCode")} optionText={<TransactionPaymentStatusField />}
        />
        <BooleanField source="status" label={translate("resources.transaction.status")}/>
        <FunctionField label={translate("resources.transaction.date")}
                       render={record => (
                         <div className='theDate'>
                           <div>
                             {translate("resources.transaction.createdAt") + ": " + `${dateFormat(record.createdAt)}`}
                           </div>
                           <div>
                             {translate("resources.transaction.updatedAt") + ": " + `${dateFormat(record.updatedAt)}`}
                           </div>

                         </div>
                       )}/>
        <FunctionField label={translate("resources.transaction.edit")}
                       render={record => (
                         <>
                           <div>
                             <EditButton label={"resources.transaction.edit"} />
                           </div>

                           {/*<EditButton label={"resources.product.content"} key={'11'}/>,*/}
                           {/*<ShowButton label={"resources.product.analytics"} key={'22'}/>,*/}

                         </>
                       )}/>

      </Datagrid>
      )}

      </List>
  );
};


export default transactionList;
