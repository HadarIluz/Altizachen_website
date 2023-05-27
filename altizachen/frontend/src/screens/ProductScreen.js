import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import React, { useContext, useEffect, useReducer, useState } from 'react';
import MessageBox from '../components/MessageBox';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import ListGroup from 'react-bootstrap/ListGroup';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import { Helmet } from 'react-helmet-async';
import { Image } from 'react-bootstrap';
import { Store } from '../Store';
import logger from 'use-reducer-logger';
import {
  MDBCard,
  MDBCardBody,
  MDBCardImage,
  MDBCol,
  MDBContainer,
  MDBIcon,
  MDBInput,
  MDBRow,
} from 'mdb-react-ui-kit';
import Modal from 'react-bootstrap/Modal';

import {
  useJsApiLoader,
  GoogleMap,
  Marker,
  DirectionsService,
  DirectionsRenderer,
} from '@react-google-maps/api';

const reducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_REQUEST':
      return { ...state, loading: true };
    case 'FETCH_SUCCESS':
      return { ...state, product: action.payload, loading: false };
    case 'FETCH_FAIL':
      return { ...state, loading: false, erroe: action.payload };

    ///////////////////////////////////////////////////////////////For useEffect of 'products'
    case 'FETCH_REQUEST1':
      return { ...state, loading: true };
    case 'FETCH_SUCCESS1':
      return { ...state, products: action.payload, loading: false };
    case 'FETCH_FAIL1':
      return { ...state, loading: false, erroe: action.payload };

    case 'DELETE_REQUEST1':
      return { ...state, loadingDelete: true, successDelete: false };
    case 'DELETE_SUCCESS1':
      return {
        ...state,
        loadingDelete: false,
        successDelete: true,
      };
    case 'DELETE_FAIL1':
      return { ...state, loadingDelete: false, successDelete: false };

    case 'DELETE_RESET1':
      return { ...state, loadingDelete: false, successDelete: false };

    //////////////////////////////////////////////////////////////

    default:
      return state;
  }
};

function ProductScreen() {
  const navigate = useNavigate();
  const { state } = useContext(Store);
  const { user } = state;
  const [body, setBody] = useState('');
  const params = useParams();
  const { id } = params;
  const [errorMsg, setErrorMsg] = useState(null);
  // Google Maps Logic
  const [openMap, setOpenMap] = useState(false);

  // origin is current logged in user address
  const [origin, setOrigin] = useState(null);

  // destination is the address of the product

  const [duration, setDuration] = useState('');
  const [distance, setDistance] = useState('');
  const [directionResponse, setDirectionResponse] = useState(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'AIzaSyBB5c0WLGH8nTZEZO06ThVwmNdK5KWSfyQ',
    libraries: ['places'],
  });

  const [map, setMap] = useState(null);

  const [{ products }, dispatch1] = useReducer(logger(reducer), {
    products: [],
    loading: true,
    error: '',
  });

  //------------------------------------------------------------------- Get of the products
  const [{ loading, error, product }, dispatch] = useReducer(reducer, {
    product: [],
    loading: true,
    error: '',
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(successCallback, errorCallback);
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  }, []);

  function successCallback(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    setOrigin({ lat: latitude, lng: longitude });

    // Use the latitude and longitude values as needed
  }

  function errorCallback(error) {
    console.error('Error getting location:', error.message);
  }
  useEffect(() => {
    const fetchData = async () => {
      dispatch({ type: 'FETCH_REQUEST' });
      try {
        const result = await axios.get(`/api/products/${id}`);
        dispatch({ type: 'FETCH_SUCCESS', payload: result.data });

        calculateRouter();
      } catch (err) {
        dispatch({ type: 'FETCH_FAIL', payload: err.message });
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    const fetchData = async () => {
      dispatch1({ type: 'FETCH_REQUEST1' });
      try {
        const result = await axios.get(`/api/products`);
        dispatch1({ type: 'FETCH_SUCCESS1', payload: result.data });

        calculateRouter();
      } catch (err) {
        dispatch1({ type: 'FETCH_FAIL1', payload: err.message });
      }
    };
    fetchData();
  }, [id]);
  //-------------------------------------------------------------------End

  const submitHandlerLike = async (e) => {
    e.preventDefault();
    try {
      product.LastReqNumber = 1;
      product.like = product.like + 1;
      console.log(product);
      const { data2 } = await axios.put(
        `/api/products/${product._id}`,
        product
      );
      if (user) {
        user._id = product.OwnerAdID;
        //user.sumOfLike = user.sumOfLike + 1;  add in put
        user.userAdCounter = products
          .filter(
            (products) => products.numberPhoneUser === product.numberPhoneUser
          )
          .map((product) => product).length;
        const likesProductsByUserSchema = {};
        likesProductsByUserSchema.product_id = product._id;
        console.log('product._id');
        console.log(product._id);
        console.log('user');
        console.log(user);
        console.log(user.likeInAds);

        user.likeInAds.push(product._id);

        const { data3 } = await axios.put(
          `/api/users/${product.OwnerAdID}`,
          user
        );
      }

      navigate(0);
    } catch (error) {
      console.log('Error in insert like into product');
      console.log(error);
      setErrorMsg(error.response.data.message);
    }
  };

  // open google Map
  const openGoogleMapHandler = async () => {
    // toggle the value of openMap state
    setOpenMap(true);
    if (!loading && origin) {
      calculateRouter();
    }
    console.log('here');
    console.log(product);
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      const comment = { body };
      if (!body) {
        setErrorMsg('Enter txet into comment body');
      }

      comment.commentID = product.CountComments;
      comment.UploadDate = new Date().toLocaleDateString();
      if (user) {
        comment.EmailOwner = user.email;
        comment.PhoneOwner = user.numberPhone;
        comment.CommentOwner = user.name;
      }
      product.reviews.push(comment);
      const { data1 } = await axios.put(
        `/api/products/${product._id}`,
        product
      );

      navigate(0);
    } catch (error) {
      console.log('The error: ......................................');
      console.log(error);
      setErrorMsg(error.response.data.message);
    }
  };

  if (!isLoaded) return <div>Loading...</div>;

  async function calculateRouter() {
    const google = window.google;
    const directionsService = new google.maps.DirectionsService();

    console.log('here', origin, product.location);
    if (!origin) return;
    const result = await directionsService.route({
      origin: origin,
      destination: product.location,
      travelMode: 'DRIVING',
    });
    console.log(result);

    setDirectionResponse(result);
    setDistance(result.routes[0].legs[0].distance.text);
    setDuration(result.routes[0].legs[0].duration.text);
  }

  console.log(directionResponse);
  return loading ? (
    <div>Loding...</div>
  ) : error ? (
    <div> {error} </div>
  ) : !isLoaded ? (
    <div>Loading...</div>
  ) : (
    <div>
      <Row>
        <Col>
          <Card.Body>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <Image
                  className="rounded"
                  src={product.image}
                  alt={product.name}
                  fluid
                />
              </ListGroup.Item>
            </ListGroup>
          </Card.Body>
        </Col>
        <Col>
          <ListGroup variant="flush">
            <ListGroup.Item>
              <Helmet>
                <title style={{ fontWeight: 'bold' }}>{product.name}</title>
              </Helmet>
              <h1>{product.name}</h1>
            </ListGroup.Item>
            <ListGroup.Item>
              <Row>
                <Col style={{ fontWeight: 'bold' }}>Uplaod date:</Col>
                <Col>{product.UploadTime}</Col>
              </Row>
            </ListGroup.Item>
            <ListGroup.Item>
              <Row>
                <Col style={{ fontWeight: 'bold' }}>Number phone:</Col>
                <Col>{product.numberPhoneUser}</Col>
              </Row>
            </ListGroup.Item>
            <ListGroup.Item>
              <Row>
                <Col style={{ fontWeight: 'bold' }}>Owner name:</Col>
                <Col>{product.OwnerName}</Col>
              </Row>
            </ListGroup.Item>
            <ListGroup.Item>
              <Row>
                <Col style={{ fontWeight: 'bold' }}>Location:</Col>
                <Col>{product.location}</Col>
              </Row>
            </ListGroup.Item>
            <ListGroup.Item>
              <Row>
                <Col style={{ fontWeight: 'bold' }}>Description:</Col>
                <Col>{product.description}</Col>
              </Row>
            </ListGroup.Item>

            <ListGroup.Item>
              <Row>
                <Col style={{ fontWeight: 'bold' }}>Amount likes:</Col>
                <Col>{product.like}</Col>
              </Row>
            </ListGroup.Item>
          </ListGroup>

          <React.Fragment>
            <Form onSubmit={submitHandlerLike}>
              {user && (
                <Button
                  className="mt-2"
                  type="submit"
                  variant="success"
                  style={{ width: '100px' }}
                >
                  Like
                </Button>
              )}
            </Form>
          </React.Fragment>

          {/* Opening Google Maps  */}
          <React.Fragment>
            {user && (
              <Button
                onClick={openGoogleMapHandler}
                className="mt-2"
                type="submit"
                variant="success"
                style={{ width: '150px' }}
              >
                View on map
              </Button>
            )}
          </React.Fragment>
        </Col>
      </Row>
      <br></br>

      {/* Google Maps  */}
      {openMap && origin && (
        <Row
          style={{
            height: '400px',
            width: '100%',

            position: 'relative',
            marginBottom: '20px',
          }}
        >
          <GoogleMap
            center={origin}
            zoom={15}
            mapContainerStyle={{ width: '100%', height: '100%' }}
            onLoad={(map) => setMap(map)}
          >
            <Marker position={origin} />
            {directionResponse && (
              <DirectionsRenderer directions={directionResponse} />
            )}
          </GoogleMap>

          {/* Distance and Duration */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              backgroundColor: 'white',
              padding: '10px',
            }}
          >
            <div>
              <span style={{ fontWeight: 'bold' }}>Distance:</span> {distance}
            </div>
            <div>
              <span style={{ fontWeight: 'bold' }}>Duration:</span> {duration}
            </div>
          </div>
        </Row>
      )}

      <Row>
        <React.Fragment>
          {errorMsg && <MessageBox variant="danger">{errorMsg}</MessageBox>}
          {user && (
            <Form onSubmit={submitHandler}>
              <div class="container">
                <div class="row">
                  <div class="col">
                    <Card>
                      <Modal.Body
                        style={{
                          maxHeight: 'calc(75vh - 210px)',
                          overflowY: 'auto',
                        }}
                      >
                        {product.reviews.map((reviews) => (
                          <MDBContainer className="mt-2">
                            <MDBCard className="mb-2">
                              <MDBCardBody>
                                <ListGroup.Item
                                  key={reviews._id}
                                  className="p-1"
                                >
                                  <div>
                                    <span style={{ fontWeight: 'bold' }}>
                                      Name:{' '}
                                    </span>
                                    {reviews.CommentOwner}
                                  </div>
                                  <div>
                                    <span style={{ fontWeight: 'bold' }}>
                                      UploadDate:{' '}
                                    </span>
                                    {reviews.UploadDate}
                                  </div>
                                  <div>
                                    <span style={{ fontWeight: 'bold' }}>
                                      Body:{' '}
                                    </span>
                                    {reviews.body}
                                  </div>
                                </ListGroup.Item>
                              </MDBCardBody>
                            </MDBCard>
                          </MDBContainer>
                        ))}
                      </Modal.Body>
                    </Card>
                  </div>
                  <div class="col">
                    <Card style={{ width: '30rem', padding: '15px' }}>
                      <Form>
                        <Form.Group className="mt-2">
                          <Col>
                            <div
                              style={{
                                fontWeight: 'bold',
                                textDecoration: 'underline',
                                display: 'inline',
                              }}
                            >
                              New comment from:{' '}
                            </div>
                            <div
                              style={{ fontWeight: 'bold', display: 'inline' }}
                            >
                              {' '}
                              {user.name}
                            </div>
                          </Col>
                        </Form.Group>
                        <Form.Group
                          className="mt-2"
                          controlId="exampleForm.ControlTextarea1"
                        >
                          <Form.Label style={{ fontWeight: 'bold' }}>
                            Body:{' '}
                          </Form.Label>
                          <Form.Control
                            placeholder="Write a new comment..."
                            type="text"
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            rows={3}
                          />
                        </Form.Group>
                      </Form>

                      <Button
                        className="mt-2"
                        type="submit"
                        variant="success"
                        style={{ width: '100px' }}
                      >
                        Post
                      </Button>
                    </Card>
                  </div>
                </div>
              </div>
            </Form>
          )}
        </React.Fragment>
      </Row>
    </div>
  );
}

export default ProductScreen;
