import React, { useEffect, useState } from 'react';
import { Col, Container, Row } from 'shards-react';
import { useNavigate, useParams } from 'react-router-dom';
import _isEqual from 'lodash/isEqual';

import PageTitle from '../components/common/PageTitle';
// import State from "#c/data/state";
import GetInformation from '#c/components/checkout/GetInformation';
import GetAddress from '#c/components/checkout/GetAddress';
import GetDelivery from '#c/components/checkout/GetDelivery';
import LastPart from '#c/components/checkout/LastPart';
import { useTranslation, withTranslation } from 'react-i18next';
import { buy, createOrder, isClient, updatetStatus } from '../functions/index';
import store from '../functions/store';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';



const AutoSubmitForm = ({ url,username, token }) => {
  useEffect(() => {
    // When the component mounts, automatically submit the form
    const form = document.getElementById('paymentForm');
    form.submit();
  }, []);

  return (
    <form
      style={{ opacity: 0 }}
      id="paymentForm"
      method="post"
      action={url}
    >
      <input name="username" value={username} type="text" readOnly />
      <br />
      <input name="token" value={token} type="text" readOnly />
      <input type="submit" style={{ display: 'none' }} />
    </form>
  );
};
function Checkout(props) {
  console.log('props', props);
  // return;
  const { t } = useTranslation();
  // let ref = this;
  let navigate = useNavigate();
  const themeData = useSelector((st) => st.store.themeData, _isEqual);
  // console.log('themedata in checkout: ', themeData,(themeData?.guestMode && !store.getState().store.user.token))
  // console.log('store : ', store.getState().store.themeData)

  // let [page, setPage] = useState((themeData?.guestMode && !store.getState().store.user.token) ? '1' : '2');
  let [page, setPage] = useState('2');
  let [the_address, setThe_address] = useState({});
  let [theUsername, setTheUsername] = useState(null);
  let [theToken, setTheToken] = useState(null);
  let [theUrl, setTheUrl] = useState(null);
  let [redirect_url, setRedirect_url] = useState('/login');
  let [redirect, setRedirect] = useState(false);
  let [amount, setAmount] = useState(0);
  let [sum, setSum] = useState(0);
  let [total, setTotal] = useState(0);
  let [card, setCard] = useState(store.getState().store.card || []);
  let [user, setUser] = useState(store.getState().store.user || []);
  let [order_id, setOrder_id] = useState(store.getState().store.order_id || []);
  let [setting, setSetting] = useState({});
  let [paymentMethod, setPaymentMethod] = useState('');
  let [discount, setDiscount] = useState('');
  let [discountCode, setdiscountCode] = useState('');
  let [deliveryPrice, setdeliveryPrice] = useState('');
  let [isInternationalCode, setIsInternationalCode] = useState(false);

  let [hoverD, setHoverD] = useState(null);
  let{ registerExtraFields}= themeData
  console.log("theme Data: ", registerExtraFields)
  const registerExtraFieldsNames= () =>{
    console.log("registerExtraFieldsNames")
    if(registerExtraFields){
      registerExtraFields.map((item) =>{
        if(item?.name === "internationalCode" && item?.require){
          setIsInternationalCode(true)
        }
      })
    }
  }
  // this.
  useEffect(() => {
    registerExtraFieldsNames();
    updateTheStatus();
  }, []);

  const updateTheStatus = (status = 'checkout') => {
    console.log('updatestatus =>')
    updatetStatus(status).then((e) => {

      console.log('eee', e);
      let { discountCode, discount, amount } = e;
      setdiscountCode(discountCode);
      setDiscount(discount);
      console.log('amountttt', amount)
      setAmount(amount);
    });
  };

  const goNext = (page) => {
    console.log('page', page);
    setPage(page);
  };

  const onSetAddress = (params) => {
    console.log('onSetAddress', params);
    setThe_address(params);
  };

  const setThePaymentMethod = (e) => {
    console.log('setPaymentMethod', e);
    setPaymentMethod(e);
  };
  const setTheDiscount = (e, d) => {
    console.log('setDiscount', e, d);
    setDiscount(e);
    setdiscountCode(d);
  };
  const setTheAmount = (e) => {
    setAmount(e);
  };
  const onChooseDelivery = (params) => {
    console.log('onChooseDelivery', params);
    setdeliveryPrice(params.deliveryPrice);
    setHoverD(params.hoverD);
    setSetting(params.setting);
    setSum(params.sum);
    setTotal(params.total);
    // setState(params);
  };

  const placeOrder = (theprice = 0,d={}) => {
    // let {address, hover, deliveryPrice, hoverD, order_id, card, setting, user, sum, paymentMethod, return_url, amount,  discountCode, discount} = state;
    // const { t } = props
    // let c;
    // console.log("placeOrder...", state);
    console.log("d",d)
    console.log("theprice",theprice)
    // return;
    console.log('placeOrder...', store.getState().store.order_id);
    // return;
    sum = 0;
    card.map((item, idx2) => {
      sum += (item.salePrice || item.price) * item.count;
    });
    let order = {
      deliveryDay: setting,
      billingAddress: the_address,
      card: card,
      customer_data: user,
      sum: sum,
      deliveryPrice: deliveryPrice,
      amount: amount,
      discountCode: discountCode,
      discount: discount,
      customer: user._id,
      extraFields:d
    };
    if (order_id) {
      order['order_id'] = order_id;
    }
    if (store.getState().store.order_id) {
      order['order_id'] = store.getState().store.order_id;
    }
    // console.log('user',user);
    // return;
    if (isInternationalCode){
    if (!user.internationalCode) {
      toast(t('Please enter international code!'), {
        type: 'error',
      });
      return;
    }
  }
    if (!user.firstName) {
      toast(t('Please enter first name!'), {
        type: 'error',
      });
      return;
    }
    if (!user.lastName) {
      toast(t('Please enter last name!'), {
        type: 'error',
      });
      return;
    }
    if (
      !order.billingAddress ||
      (order.billingAddress && order.billingAddress.length < 1)
    ) {
      toast(t('Please enter address!'), {
        type: 'error',
      });
      return;
    }
    toast(t('Submitting order...'), {
      type: 'success',
    });

    console.log('order', order);
    console.log('paymentMethod', paymentMethod);
    // return;

    createOrder(order).then((res) => {
      console.log('res for judytgs is:', res);
      if (!res.success) {
        toast(t(res.message), {
          type: 'error',
        });
        return 0;
      }
      toast(t('Submitting transaction...'), {
        type: 'success',
      });
      // return
      buy(
        res.order._id,
        {
          method: paymentMethod,
        },
        theprice
      ).then((add) => {
        if (add?.success && add?.url) {
          toast(t('Navigating...'), {
            type: 'success',
          });
          if (isClient) window.location.replace(add.url);
        }
        if (add?.success && add?.token && add?.username && add?.theUrl) {
          toast(t('Navigating...'), {
            type: 'success',
          });
          setTheToken(add?.token)
          setTheUrl(add?.theUrl)
          setTheUsername(add?.username)
          // if (isClient) window.location.replace(add.url);
        }
        if (!add.success)
          return toast(t('Error...'), {
            type: 'error',
          });
        console.log('ass', add);
        // if (isClient) window.location.replace(add.url);
      });
    });
  };

  // render() {
  const { _id } = props;
  // let sum = 0;
  // let {renTimes, order_id, paymentMethod, deletModals, return_url, redirect, redirect_url,  sum, modals, address, hover, hoverD, amount, deliveryPrice, setting,  discount, discountCode} = state;
  let { firstName, lastName, internationalCode, token } =
    store.getState().store.user;
  // sum = 0;
  let dp = 0;
  // console.log('this.state.checkout', state);
  // console.log('card', card);
  // console.log('settings', settings);
  console.log('page', page, page);

  // return null;
  // if(themeData?.passwordAuthentication)
  if (!firstName || !lastName) {
    console.log("no f and l name",firstName)
    console.log("no f and l lastName",lastName)
    console.log("no f and l internationalCode",internationalCode)

    // return;
    redirect = true;
    redirect_url = '/login/goToCheckout';
  }
  if (!token) {
    redirect = true;
    redirect_url = '/login/goToCheckout';

  }
  // if (!token && themeData?.guestMode) {
  //   console.log("no t", token , themeData?.guestMode)
  //   redirect = false;
  // }
  // return

  if (redirect) {
    console.log('redirect_url', redirect, redirect_url);

    return navigate(redirect_url);
    // if (!_id) {
    // return;
    //   _id = this.props.match.params._id;
    // }
    // this.cameFromProduct(_id);
    // Promise.all([savePost({goToCheckout: true})]).then(() => {
    // return navigate(redirect_url);

    // })
    // ;
  }
  // } else {
  if (!page) return <></>;

  return (
    <Container fluid className="main-content-container px-4 maxWidth1200">
      <Row noGutters className="page-header py-4">
        <PageTitle
          title={t('Submit order')}
          subtitle={t('order details')}
          md="12"
          className="ml-sm-auto mr-sm-auto"
        />
      </Row>
      {page == '1' && (
        <Row>
          <Col lg="2"></Col>
          <Col lg="8">
            <GetInformation onNext={() => goNext('2')} />
          </Col>
          <Col lg="2"></Col>
        </Row>
      )}
      {page == '2' && (
        <Row>
          <Col lg="2"></Col>
          <Col lg="8">
            <GetAddress
              onNext={() => goNext('3')}
              onSetAddress={(params) => onSetAddress(params)}
              onPrev={() => goNext('1')}
            />
          </Col>
          <Col lg="2"></Col>
        </Row>
      )}
      {page == '3' && (
        <Row>
          <Col lg="2"></Col>
          <Col lg="8">
            <GetDelivery
              onNext={() => goNext('4')}
              onChooseDelivery={(params) => {
                onChooseDelivery(params);
              }}
              addressChoosed={the_address}
              onPrev={() => goNext('2')}
            />
          </Col>
          <Col lg="2"></Col>
        </Row>
      )}
      {page == '4' && (
        <Row>
          <Col lg="2"></Col>
          <Col lg="8">
            <LastPart
              onPrev={() => goNext('3')}
              onPlaceOrder={(e,d) => {
                placeOrder(e,d);
              }}
              theParams={{
                sum,
                discount,
                discountCode,
                amount,
                // tax: (themeData && themeData.tax) ? themeData.tax : 0,
                deliveryPrice,
                address: the_address,
                setting,
                setPaymentMethod: (e) => {
                  console.log('setPaymentMethod', e);
                  setThePaymentMethod(e);
                },
                setamount: (e) => {
                  console.log('setTheAmount', e);
                  setTheAmount(e);
                },
                setDiscount: (e, d = '') => {
                  console.log('setDiscount', e, d);
                  setTheDiscount(e, d);
                },
              }}
            />
          </Col>
          <Col lg="2"></Col>
        </Row>
      )}
      {/*{theToken}*/}
      {/*{theUsername}*/}
      {/*{theUrl}*/}
      {(theToken && theUsername && theUrl) && <AutoSubmitForm url={theUrl} username={theUsername} token={theToken} />}
    </Container>
  );
  // }
  // }
}

export default withTranslation()(Checkout);

// class Checkout2 extends React.Component {
//   constructor(props) {
//     super(props);
//     const { t } = props;
//     let ref = this;
//     this.state = {
//       redirect_url: "/login",
//       redirect: null,
//       page: "2",
//       amount: 0,
//       sum: 0,
//       card: store.getState().store.card || [],
//       user: store.getState().store.user || [],
//       order_id: store.getState().store.order_id || "",
//       setting: {},
//       paymentMethod: "",
//       discount: "",
//       discountCode: "",
//       deliveryPrice: 0,
//       token: store.getState().store.user.token || "",
//       firstName: store.getState().store.user.firstName || "",
//       lastName: store.getState().store.user.lastName || "",
//       internationalCode: store.getState().store.user.internationalCode || null,
//       the_address: {}
//     };
//     this.updateTheStatus();
//   }
//
//   updateTheStatus(status = "checkout") {
//     updatetStatus(status).then(e=>{
//       console.log('e',e)
//       let {discountCode,discount,amount}=e;
//       this.setState({discountCode,discount,amount})
//     });
//   }
//
//   goNext(page) {
//     console.log("page", page);
//     this.setState({ page: page });
//
//   }
//
//   onSetAddress(params) {
//     console.log("onSetAddress", params);
//     this.setState({ the_address: params });
//
//   }
//
//   setPaymentMethod(e) {
//     console.log("setPaymentMethod", e);
//
//     this.setState({paymentMethod:e})
//   }
//   setDiscount(e,d) {
//     console.log("setDiscount", e,d);
//
//     this.setState({discount:e,discountCode:d})
//   }
//   setamount(e) {
//     console.log("setamount", e);
//
//     this.setState({amount:e})
//   }
//   onChooseDelivery(params) {
//     console.log("onChooseDelivery", params);
//     this.setState(params);
//
//   }
//
//   placeOrder(theprice = 0) {
//
//     let { address, hover, deliveryPrice, hoverD, order_id, card, setting, user, sum, paymentMethod, return_url, amount, the_address,discountCode,discount } = this.state;
//     const { t } = this.props;
//     console.log("placeOrder...", this.state);
//     console.log("placeOrder...", store.getState().store.order_id);
//     // return;
//     sum = 0;
//     card.map((item, idx2) => {
//
//       sum += (item.salePrice || item.price) * item.count;
//
//     });
//     let order = {
//       deliveryDay: setting,
//       billingAddress: the_address,
//       card: card,
//       customer_data: user,
//       sum: sum,
//       deliveryPrice: deliveryPrice,
//       amount: amount,
//       discountCode: discountCode,
//       discount: discount,
//       customer: user._id,
//     };
//     if(order_id){
//       order['order_id']=order_id
//     }
//     if(store.getState().store.order_id){
//       order['order_id']=store.getState().store.order_id
//     }
//     // console.log('user',user);
//     // return;
//     if (!user.internationalCode) {
//       toast(t("Please enter international code!"), {
//         type: "error"
//       });
//       return;
//     }
//     if (!user.firstName) {
//       toast(t("Please enter first name!"), {
//         type: "error"
//       });
//       return;
//     }
//     if (!user.lastName) {
//       toast(t("Please enter last name!"), {
//         type: "error"
//       });
//       return;
//     }
//     if (!order.billingAddress || (order.billingAddress && order.billingAddress.length < 1)) {
//       toast(t("Please enter address!"), {
//         type: "error"
//       });
//       return;
//
//     }
//     toast(t("Submitting order..."), {
//       type: "success"
//     });
//
//     console.log('order',order);
//     console.log('paymentMethod',paymentMethod);
//     // return;
//
//       createOrder(order).then((res) => {
//
//         // console.log('res for judytgs is:', res.order._id);
//         if (!res.success) {
//
//           toast(t(res.message), {
//             type: "error"
//           });
//           return 0;
//         }
//         toast(t("Submitting transaction..."), {
//           type: "success"
//         });
//         buy(res.order._id, {
//           method:this.state.paymentMethod
//         }, theprice).then((add) => {
//           if (add.success)
//             toast(t("Navigating..."), {
//               type: "success"
//             });
//           if (!add.success)
//             return toast(t("Error..."), {
//               type: "error"
//             });
//           console.log("ass", add);
//           if (isClient)
//             window.location.replace(add.url);
//         });
//       });
//
//
//   }
//
//   render() {
//     const { t, _id } = this.props;
//     // let sum = 0;
//     let { renTimes, order_id, paymentMethod, deletModals, return_url, the_address, redirect, redirect_url, page, sum, modals, token, address, hover, hoverD, amount, deliveryPrice, setting, firstName, lastName, internationalCode,discount,discountCode } = this.state;
//     // sum = 0;
//     let dp = 0;
//     console.log('this.state.checkout', this.state);
//     // console.log('card', card);
//     // console.log('settings', settings);
//
//     // return null;
//     if (!firstName || !lastName || !internationalCode) {
//       redirect = true;
//       redirect_url = "/login/goToCheckout";
//     }
//     if (!token) {
//       redirect = true;
//     }
//     if (redirect) {
//       console.log("redirect_url", redirect, redirect_url);
//       // if (!_id) {
//       //   _id = this.props.match.params._id;
//       // }
//       // this.cameFromProduct(_id);
//       // Promise.all([savePost({goToCheckout: true})]).then(() => {
//       return <Navigate to={redirect_url} push={false} exact={true}/>;
//
//       // })
//       // ;
//     }
//     // } else {
//     return (
//       <Container fluid className="main-content-container px-4 maxWidth1200">
//         <Row noGutters className="page-header py-4">
//           <PageTitle title={t("Submit order")} subtitle={t("order details")} md="12"
//                      className="ml-sm-auto mr-sm-auto"/>
//         </Row>
//         {page == "1" && <Row>
//           <Col lg="2"></Col>
//           <Col lg="8">
//             <GetInformation onNext={() => this.goNext("2")}/>
//           </Col>
//           <Col lg="2"></Col>
//         </Row>}
//         {page == "2" && <Row>
//
//
//           <Col lg="2"></Col>
//           <Col lg="8">
//             <GetAddress onNext={() => this.goNext("3")} onSetAddress={(params) => this.onSetAddress(params)}
//                         onPrev={() => this.goNext("1")}/>
//
//           </Col>
//           <Col lg="2"></Col>
//
//
//         </Row>}
//         {page == "3" && <Row>
//
//
//           <Col lg="2"></Col>
//           <Col lg="8">
//
//             <GetDelivery onNext={() => this.goNext("4")} onChooseDelivery={(params) => {
//               this.onChooseDelivery(params);
//             }} addressChoosed={the_address}
//                          onPrev={() => this.goNext("2")}/>
//
//           </Col>
//           <Col lg="2"></Col>
//
//
//         </Row>}
//         {page == "4" && <Row>
//
//
//           <Col lg="2"></Col>
//           <Col lg="8">
//             <LastPart onPrev={() => this.goNext("3")} onPlaceOrder={(e) => {
//               this.placeOrder(e);
//             }} theParams={{ sum,discount,discountCode, amount, deliveryPrice, address: the_address, setting,setPaymentMethod:(e)=>{
//               console.log('setPaymentMethod',e)
//               this.setPaymentMethod(e)
//             },setamount:(e)=>{
//               console.log('setamount',e)
//               this.setamount(e)
//             },setDiscount:(e,d='')=>{
//               console.log('setDiscount',e,d)
//               this.setDiscount(e,d)
//             } }}/>
//           </Col>
//           <Col lg="2"></Col>
//
//
//         </Row>}
//       </Container>
//     );
//     // }
//   }
// }

// export default withTranslation()(Checkout);
