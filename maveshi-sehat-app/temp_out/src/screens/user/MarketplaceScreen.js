'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

exports['default'] = MarketplaceScreen;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactNative = require('react-native');

var _reactNavigationNative = require('@react-navigation/native');

var _reactNativeVectorIconsFeather = require('react-native-vector-icons/Feather');

var _reactNativeVectorIconsFeather2 = _interopRequireDefault(_reactNativeVectorIconsFeather);

var _reactNativeVectorIconsMaterialCommunityIcons = require('react-native-vector-icons/MaterialCommunityIcons');

var _reactNativeVectorIconsMaterialCommunityIcons2 = _interopRequireDefault(_reactNativeVectorIconsMaterialCommunityIcons);

var _utilsProfileStore = require('../../utils/profileStore');

var _utilsTranslate = require('../../utils/translate');

var _utilsCartStore = require('../../utils/cartStore');

var getImageUrl = function getImageUrl(url) {
  if (!url) return null;
  if (_reactNative.Platform.OS === 'android') {
    return url.replace('localhost:5000', '10.0.2.2:5000').replace('127.0.0.1:5000', '10.0.2.2:5000');
  }
  return url;
};

function MarketplaceScreen() {
  var _this = this;

  var _useTranslation = (0, _utilsTranslate.useTranslation)();

  var t = _useTranslation.t;

  var navigation = (0, _reactNavigationNative.useNavigation)();
  var route = (0, _reactNavigationNative.useRoute)();
  var params = route.params || {};

  var _useState = (0, _react.useState)((0, _utilsProfileStore.getProfile)());

  var _useState2 = _slicedToArray(_useState, 1);

  var profile = _useState2[0];

  var userName = profile.userName || params.userName || 'Muhammad Ahmed';
  var userId = params.userId || null;

  var _useState3 = (0, _react.useState)([]);

  var _useState32 = _slicedToArray(_useState3, 2);

  var medicines = _useState32[0];
  var setMedicines = _useState32[1];

  var _useState4 = (0, _react.useState)(true);

  var _useState42 = _slicedToArray(_useState4, 2);

  var loading = _useState42[0];
  var setLoading = _useState42[1];

  var _useState5 = (0, _react.useState)(false);

  var _useState52 = _slicedToArray(_useState5, 2);

  var refreshing = _useState52[0];
  var setRefreshing = _useState52[1];

  var _useState6 = (0, _react.useState)('');

  var _useState62 = _slicedToArray(_useState6, 2);

  var searchQuery = _useState62[0];
  var setSearchQuery = _useState62[1];

  var _useState7 = (0, _react.useState)('All');

  var _useState72 = _slicedToArray(_useState7, 2);

  var selectedCategory = _useState72[0];
  var setSelectedCategory = _useState72[1];

  var _useState8 = (0, _react.useState)((0, _utilsCartStore.getCartCount)());

  var _useState82 = _slicedToArray(_useState8, 2);

  var cartCount = _useState82[0];
  var setCartCount = _useState82[1];

  (0, _react.useEffect)(function () {
    var unsubscribe = (0, _utilsCartStore.subscribeCart)(function () {
      setCartCount((0, _utilsCartStore.getCartCount)());
    });
    return function () {
      return unsubscribe();
    };
  }, []);

  var fetchMedicines = function fetchMedicines() {
    var baseUrl, response, data, activeMeds;
    return regeneratorRuntime.async(function fetchMedicines$(context$2$0) {
      while (1) switch (context$2$0.prev = context$2$0.next) {
        case 0:
          context$2$0.prev = 0;
          baseUrl = _reactNative.Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
          context$2$0.next = 4;
          return regeneratorRuntime.awrap(fetch(baseUrl + '/api/admin/medicines'));

        case 4:
          response = context$2$0.sent;

          if (response.ok) {
            context$2$0.next = 7;
            break;
          }

          throw new Error('Failed to fetch medicines');

        case 7:
          context$2$0.next = 9;
          return regeneratorRuntime.awrap(response.json());

        case 9:
          data = context$2$0.sent;
          activeMeds = data.filter(function (med) {
            return med.status !== 'inactive';
          });

          setMedicines(activeMeds);
          context$2$0.next = 17;
          break;

        case 14:
          context$2$0.prev = 14;
          context$2$0.t0 = context$2$0['catch'](0);

          console.error('Error fetching medicines:', context$2$0.t0);

        case 17:
          context$2$0.prev = 17;

          setLoading(false);
          setRefreshing(false);
          return context$2$0.finish(17);

        case 21:
        case 'end':
          return context$2$0.stop();
      }
    }, null, _this, [[0, 14, 17, 21]]);
  };

  (0, _react.useEffect)(function () {
    fetchMedicines();
  }, []);

  var handleRefresh = function handleRefresh() {
    setRefreshing(true);
    fetchMedicines();
  };

  var categories = ['All', 'Medicines', 'Vaccines', 'Supplements'];

  var filteredMedicines = medicines.filter(function (med) {

    var matchesSearch = med.name.toLowerCase().includes(searchQuery.toLowerCase()) || med.name_urdu && med.name_urdu.toLowerCase().includes(searchQuery.toLowerCase()) || med.manufacturer && med.manufacturer.toLowerCase().includes(searchQuery.toLowerCase());

    var matchesCategory = true;
    if (selectedCategory === 'Medicines') {

      matchesCategory = med.category.toLowerCase() !== 'vaccine' && med.category.toLowerCase() !== 'vitamin';
    } else if (selectedCategory === 'Vaccines') {
      matchesCategory = med.category.toLowerCase() === 'vaccine';
    } else if (selectedCategory === 'Supplements') {
      matchesCategory = med.category.toLowerCase() === 'vitamin' || med.category.toLowerCase() === 'supplements';
    }

    return matchesSearch && matchesCategory;
  });

  var getMedIcon = function getMedIcon(med) {
    var form = (med.dosage_form || '').toLowerCase();
    var cat = med.category.toLowerCase();

    if (form.includes('injection') || form.includes('vial') || form.includes('ampoule')) {
      return _react2['default'].createElement(_reactNativeVectorIconsMaterialCommunityIcons2['default'], { name: 'needle', size: 36, color: '#58D66D' });
    }
    if (cat === 'vaccine') {
      return _react2['default'].createElement(_reactNativeVectorIconsMaterialCommunityIcons2['default'], { name: 'pill', size: 36, color: '#FF5252' });
    }
    if (form.includes('syrup') || form.includes('suspension') || form.includes('liquid') || form.includes('bottle')) {
      return _react2['default'].createElement(_reactNativeVectorIconsMaterialCommunityIcons2['default'], { name: 'bottle-tonic-plus', size: 36, color: '#FFB020' });
    }
    return _react2['default'].createElement(_reactNativeVectorIconsMaterialCommunityIcons2['default'], { name: 'pill', size: 36, color: '#58D66D' });
  };

  var renderMedicineCard = function renderMedicineCard(_ref) {
    var item = _ref.item;

    var isOutOfStock = item.stock <= 0;

    var rating = (4.0 + item.id % 10 * 0.1).toFixed(1);

    return _react2['default'].createElement(
      _reactNative.View,
      { style: styles.card },
      _react2['default'].createElement(
        _reactNative.View,
        { style: styles.cardImgBox },
        item.image_url ? _react2['default'].createElement(_reactNative.Image, { source: { uri: getImageUrl(item.image_url) }, style: styles.cardImg }) : _react2['default'].createElement(_reactNative.Image, {
          source: {
            uri: item.category.toLowerCase() === 'vaccine' ? 'https://images.unsplash.com/photo-1618588507085-c79565432917?auto=format&fit=crop&q=80&w=200' : 'https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&q=80&w=200'
          },
          style: styles.cardImg
        })
      ),
      _react2['default'].createElement(
        _reactNative.View,
        { style: styles.cardBody },
        _react2['default'].createElement(
          _reactNative.Text,
          { style: styles.medName, numberOfLines: 2 },
          t(item.name, item.name_urdu || item.name)
        ),
        _react2['default'].createElement(
          _reactNative.View,
          { style: styles.medMetaRow },
          _react2['default'].createElement(
            _reactNative.Text,
            { style: styles.ratingText },
            '★ ',
            rating
          ),
          _react2['default'].createElement(
            _reactNative.Text,
            { style: styles.metaDivider },
            '•'
          ),
          _react2['default'].createElement(
            _reactNative.Text,
            { style: styles.strengthText, numberOfLines: 1 },
            item.strength || 'dose'
          )
        ),
        _react2['default'].createElement(
          _reactNative.View,
          { style: styles.priceRow },
          _react2['default'].createElement(
            _reactNative.Text,
            { style: styles.priceText },
            'Rs. ',
            Math.round(item.price)
          ),
          _react2['default'].createElement(
            _reactNative.View,
            { style: [styles.stockBadge, { backgroundColor: isOutOfStock ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)' }] },
            _react2['default'].createElement(
              _reactNative.Text,
              { style: [styles.stockBadgeText, { color: isOutOfStock ? '#ef4444' : '#10b981' }] },
              isOutOfStock ? t('Out of Stock', '????? ??? ??') : t('In Stock', '?????? ??')
            )
          )
        ),
        _react2['default'].createElement(
          _reactNative.TouchableOpacity,
          {
            style: [styles.addBtn, isOutOfStock && styles.addBtnDisabled],
            onPress: function () {
              return !isOutOfStock && (0, _utilsCartStore.addToCart)(item);
            },
            disabled: isOutOfStock,
            activeOpacity: 0.8
          },
          _react2['default'].createElement(
            _reactNative.Text,
            { style: styles.addBtnText },
            t('Add to Cart', '????? ??? ???? ????')
          )
        )
      )
    );
  };

  return _react2['default'].createElement(
    _reactNative.SafeAreaView,
    { style: styles.safeArea },
    _react2['default'].createElement(_reactNative.StatusBar, { barStyle: 'light-content', backgroundColor: '#58D66D' }),
    _react2['default'].createElement(
      _reactNative.View,
      { style: styles.header },
      _react2['default'].createElement(
        _reactNative.View,
        { style: styles.headerTop },
        _react2['default'].createElement(
          _reactNative.TouchableOpacity,
          { style: styles.backButton, onPress: function () {
              return navigation.goBack();
            } },
          _react2['default'].createElement(_reactNativeVectorIconsFeather2['default'], { name: 'chevron-left', size: 26, color: '#FFF' })
        ),
        _react2['default'].createElement(
          _reactNative.View,
          { style: styles.headerTitleBlock },
          _react2['default'].createElement(
            _reactNative.Text,
            { style: styles.headerTitle },
            'Marketplace'
          )
        ),
        _react2['default'].createElement(
          _reactNative.TouchableOpacity,
          {
            style: styles.cartButton,
            onPress: function () {
              return navigation.navigate('Cart', { userName: userName, userId: userId });
            }
          },
          _react2['default'].createElement(_reactNativeVectorIconsFeather2['default'], { name: 'shopping-cart', size: 22, color: '#4CB85C' }),
          cartCount > 0 && _react2['default'].createElement(
            _reactNative.View,
            { style: styles.cartBadge },
            _react2['default'].createElement(
              _reactNative.Text,
              { style: styles.cartBadgeText },
              cartCount
            )
          )
        )
      ),
      _react2['default'].createElement(
        _reactNative.View,
        { style: styles.searchContainer },
        _react2['default'].createElement(_reactNativeVectorIconsFeather2['default'], { name: 'search', size: 18, color: '#888', style: styles.searchIcon }),
        _react2['default'].createElement(_reactNative.TextInput, {
          style: styles.searchInput,
          placeholder: t('Search medicines...', '?????? ???? ????...'),
          placeholderTextColor: '#888',
          value: searchQuery,
          onChangeText: setSearchQuery
        }),
        searchQuery.length > 0 && _react2['default'].createElement(
          _reactNative.TouchableOpacity,
          { onPress: function () {
              return setSearchQuery('');
            } },
          _react2['default'].createElement(_reactNativeVectorIconsFeather2['default'], { name: 'x', size: 18, color: '#888' })
        )
      )
    ),
    _react2['default'].createElement(
      _reactNative.View,
      { style: styles.categoriesContainer },
      _react2['default'].createElement(_reactNative.FlatList, {
        data: categories,
        horizontal: true,
        showsHorizontalScrollIndicator: false,
        keyExtractor: function (item) {
          return item;
        },
        contentContainerStyle: styles.categoriesList,
        renderItem: function (_ref2) {
          var item = _ref2.item;

          var isActive = selectedCategory === item;

          return _react2['default'].createElement(
            _reactNative.TouchableOpacity,
            {
              style: isActive ? styles.catPillActive : styles.catPill,
              onPress: function () {
                return setSelectedCategory(item);
              }
            },
            _react2['default'].createElement(
              _reactNative.Text,
              { style: isActive ? styles.catPillTextActive : styles.catPillText },
              t(item)
            )
          );
        }
      })
    ),
    loading && !refreshing ? _react2['default'].createElement(
      _reactNative.View,
      { style: styles.loaderContainer },
      _react2['default'].createElement(_reactNative.ActivityIndicator, { size: 'large', color: '#58D66D' }),
      _react2['default'].createElement(
        _reactNative.Text,
        { style: styles.loadingText },
        t('Loading medicines...', '?????? ??? ?? ??? ???...')
      )
    ) : filteredMedicines.length > 0 ? _react2['default'].createElement(_reactNative.FlatList, {
      data: filteredMedicines,
      numColumns: 2,
      renderItem: renderMedicineCard,
      keyExtractor: function (item) {
        return item.id.toString();
      },
      columnWrapperStyle: styles.gridRow,
      contentContainerStyle: styles.listContainer,
      refreshing: refreshing,
      onRefresh: handleRefresh,
      showsVerticalScrollIndicator: false
    }) : _react2['default'].createElement(
      _reactNative.View,
      { style: styles.emptyContainer },
      _react2['default'].createElement(_reactNativeVectorIconsMaterialCommunityIcons2['default'], { name: 'pill-off', size: 64, color: '#CCC' }),
      _react2['default'].createElement(
        _reactNative.Text,
        { style: styles.emptyText },
        t('No medicines found', '???? ?????? ???? ????')
      )
    ),
    _react2['default'].createElement(
      _reactNative.View,
      { style: styles.bottomNav },
      _react2['default'].createElement(
        _reactNative.TouchableOpacity,
        { style: styles.navItem, onPress: function () {
            return navigation.navigate('Dashboard');
          } },
        _react2['default'].createElement(_reactNativeVectorIconsFeather2['default'], { name: 'home', size: 22, color: '#A3E6B2' }),
        _react2['default'].createElement(
          _reactNative.Text,
          { style: [styles.navText, { color: '#A3E6B2' }] },
          t('Home')
        )
      ),
      _react2['default'].createElement(
        _reactNative.TouchableOpacity,
        { style: styles.navItem, onPress: function () {
            return navigation.navigate('AiScan');
          } },
        _react2['default'].createElement(_reactNativeVectorIconsMaterialCommunityIcons2['default'], { name: 'line-scan', size: 22, color: '#A3E6B2' }),
        _react2['default'].createElement(
          _reactNative.Text,
          { style: [styles.navText, { color: '#A3E6B2' }] },
          t('AI Scan')
        )
      ),
      _react2['default'].createElement(
        _reactNative.TouchableOpacity,
        { style: styles.navItem, onPress: function () {
            return navigation.navigate('HealthRecords');
          } },
        _react2['default'].createElement(_reactNativeVectorIconsFeather2['default'], { name: 'file-text', size: 22, color: '#A3E6B2' }),
        _react2['default'].createElement(
          _reactNative.Text,
          { style: [styles.navText, { color: '#A3E6B2' }] },
          t('Records')
        )
      ),
      _react2['default'].createElement(
        _reactNative.TouchableOpacity,
        { style: styles.navItem, onPress: function () {
            return navigation.navigate('CommunityForum');
          } },
        _react2['default'].createElement(_reactNativeVectorIconsFeather2['default'], { name: 'message-square', size: 22, color: '#A3E6B2' }),
        _react2['default'].createElement(
          _reactNative.Text,
          { style: [styles.navText, { color: '#A3E6B2' }] },
          t('Forum')
        )
      ),
      _react2['default'].createElement(
        _reactNative.TouchableOpacity,
        { style: styles.navItem, onPress: function () {
            return navigation.navigate('Profile');
          } },
        _react2['default'].createElement(_reactNativeVectorIconsFeather2['default'], { name: 'user', size: 22, color: '#A3E6B2' }),
        _react2['default'].createElement(
          _reactNative.Text,
          { style: [styles.navText, { color: '#A3E6B2' }] },
          t('Profile')
        )
      )
    )
  );
}

var styles = _reactNative.StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAF9'
  },
  header: {
    backgroundColor: '#58D66D',
    paddingHorizontal: 16,
    paddingTop: _reactNative.Platform.OS === 'android' ? (_reactNative.StatusBar.currentHeight || 0) + 14 : 14,
    paddingBottom: 40,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  backButton: {
    padding: 2
  },
  headerTitleBlock: {
    alignItems: 'center'
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: _reactNative.Platform.OS === 'ios' ? 'Outfit' : 'sans-serif-medium'
  },
  headerSubtitle: {
    color: '#E8F8EA',
    fontSize: 12,
    marginTop: 2
  },
  cartButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF7A5C',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF'
  },
  cartBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold'
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 46
  },
  searchIcon: {
    marginRight: 8,
    color: '#FFF'
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#FFF',
    height: '100%'
  },
  categoriesContainer: {
    marginTop: -22,
    marginBottom: 14,
    zIndex: 10
  },
  categoriesList: {
    paddingHorizontal: 16,
    gap: 8
  },
  catPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  catPillActive: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#4CB85C'
  },
  catPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B'
  },
  catPillTextActive: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF'
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B'
  },
  gridRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 16
  },
  listContainer: {
    paddingBottom: 100,
    gap: 16
  },
  card: {
    backgroundColor: '#FFF',
    width: '47%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8F2EC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1.5,
    overflow: 'hidden'
  },
  cardImgBox: {
    height: 100,
    backgroundColor: '#F3FBF5',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  cardImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover'
  },
  cardBody: {
    padding: 12,
    gap: 4
  },
  medNameEn: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B'
  },
  medNameUr: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600'
  },
  medMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFB020'
  },
  metaDivider: {
    fontSize: 11,
    color: '#94A3B8'
  },
  strengthText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    flex: 1
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4
  },
  priceText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B'
  },
  stockBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  stockBadgeText: {
    fontSize: 9,
    fontWeight: 'bold'
  },
  addBtn: {
    backgroundColor: '#4CB85C',
    borderRadius: 10,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8
  },
  addBtnDisabled: {
    backgroundColor: '#E2E8F0'
  },
  addBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold'
  },
  emptyContainer: {
    flex: 0.6,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: 'bold',
    color: '#94A3B8'
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#4CB85C',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 14,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 5
  },
  navItem: {
    alignItems: 'center'
  },
  navText: {
    fontSize: 10,
    color: '#FFF',
    marginTop: 4,
    fontWeight: '600'
  }
});
module.exports = exports['default'];