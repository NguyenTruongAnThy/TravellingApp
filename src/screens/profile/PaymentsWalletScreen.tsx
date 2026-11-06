import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  DEFAULT_WALLET_DATA,
  PaymentCardItem,
  WalletData,
} from '../../services/profileService';

interface PaymentsWalletScreenProps {
  navigation?: any;
}

export default function PaymentsWalletScreen({ navigation }: PaymentsWalletScreenProps) {
  const [wallet, setWallet] = useState<WalletData>(DEFAULT_WALLET_DATA);
  const [selectedTab, setSelectedTab] = useState<'methods' | 'payouts' | 'history'>('methods');
  const [autoApply, setAutoApply] = useState(wallet.autoApply);

  // Add Method Modal State
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [cardType, setCardType] = useState<'visa' | 'mastercard' | 'paypal'>('visa');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState('');

  // Handle Make Default Card
  const handleMakeDefault = (cardId: string) => {
    const updatedCards = wallet.cards.map((c) => ({
      ...c,
      isDefault: c.id === cardId,
      badge: c.id === cardId ? 'Default payment method' : undefined,
      actionText: c.id === cardId ? undefined : 'Make default',
    }));
    setWallet({ ...wallet, cards: updatedCards });
    Alert.alert('Default Updated', 'Your default payment method has been updated.');
  };

  // Handle Add Card
  const handleAddPaymentMethod = () => {
    if (cardType === 'paypal') {
      const newCard: PaymentCardItem = {
        id: `paypal-${Date.now()}`,
        type: 'paypal',
        title: 'PayPal',
        subtitle: cardHolder.trim() || 'alex.morgan@example.com',
        isDefault: false,
      };
      setWallet({ ...wallet, cards: [...wallet.cards, newCard] });
      setAddModalVisible(false);
      resetAddForm();
      Alert.alert('Payment Method Added', 'Your PayPal account has been linked.');
      return;
    }

    if (!cardNumber.trim() || cardNumber.replace(/\s/g, '').length < 4) {
      Alert.alert('Invalid Card', 'Please enter a valid card number.');
      return;
    }

    const last4 = cardNumber.replace(/\s/g, '').slice(-4);
    const newCard: PaymentCardItem = {
      id: `card-${Date.now()}`,
      type: cardType,
      title: `${cardType === 'visa' ? 'Visa' : 'Mastercard'} ending in ${last4}`,
      subtitle: `Expires ${cardExpiry.trim() || '12/28'}`,
      isDefault: false,
      secondaryText: 'Physical Card',
      actionText: 'Make default',
    };

    setWallet({ ...wallet, cards: [...wallet.cards, newCard] });
    setAddModalVisible(false);
    resetAddForm();
    Alert.alert('Payment Method Added', `${newCard.title} has been added successfully.`);
  };

  const resetAddForm = () => {
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setCardHolder('');
  };

  const handleMoreOptions = () => {
    Alert.alert('Payments & Security', 'Financial Settings', [
      {
        text: 'View Tax Documents',
        onPress: () => Alert.alert('Tax Documents', '1099-K tax documents are available in January.'),
      },
      {
        text: 'Manage Currencies',
        onPress: () => Alert.alert('Currency', 'Default currency is set to USD ($).'),
      },
      { text: 'Close', style: 'cancel' },
    ]);
  };

  const handleCardOptions = (card: PaymentCardItem) => {
    Alert.alert(card.title, 'Payment method settings', [
      card.isDefault
        ? { text: 'Currently Default', style: 'cancel' }
        : { text: 'Set as Default', onPress: () => handleMakeDefault(card.id) },
      {
        text: 'Remove Method',
        style: 'destructive',
        onPress: () => {
          if (card.isDefault) {
            Alert.alert('Cannot Remove', 'Please set another method as default before removing.');
            return;
          }
          setWallet({
            ...wallet,
            cards: wallet.cards.filter((c) => c.id !== card.id),
          });
          Alert.alert('Removed', 'Payment method has been removed.');
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAF8FF]" edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View className="h-16 px-4 flex-row items-center justify-between border-b border-[#E6E3F5]/80 bg-[#FAF8FF]">
        <View className="flex-row items-center gap-2 flex-1">
          <Pressable
            className="w-10 h-10 rounded-full items-center justify-center bg-white shadow-sm border border-borderLight/30 active:opacity-70"
            onPress={() => {
              if (navigation?.goBack) {
                navigation.goBack();
              }
            }}
          >
            <Ionicons name="chevron-back" size={20} color="#131B2E" />
          </Pressable>
          <Text className="text-lg font-bold text-textMain ml-1">Payments & Payouts</Text>
        </View>

        <View className="flex-row items-center gap-2">
          <Pressable
            className="w-9 h-9 rounded-full items-center justify-center bg-white shadow-sm border border-borderLight/30 active:opacity-70"
            onPress={handleMoreOptions}
          >
            <Ionicons name="ellipsis-horizontal" size={17} color="#131B2E" />
          </Pressable>
          <View className="w-8 h-8 rounded-full bg-[#006877] items-center justify-center shadow-sm ml-0.5">
            <Ionicons name="person" size={15} color="#FFFFFF" />
          </View>
        </View>
      </View>

      {/* Top Segmented Tabs */}
      <View className="px-4 py-2.5 bg-[#FAF8FF]">
        <View className="flex-row items-center p-1 rounded-full bg-[#E2E7FF] border border-borderLight/20">
          <Pressable
            className={`flex-1 py-2 rounded-full items-center justify-center ${
              selectedTab === 'methods' ? 'bg-[#4D44E3] shadow-sm' : ''
            }`}
            onPress={() => setSelectedTab('methods')}
          >
            <Text
              className={`text-xs font-semibold ${
                selectedTab === 'methods' ? 'text-white' : 'text-[#3C494C]'
              }`}
            >
              Payment Methods
            </Text>
          </Pressable>

          <Pressable
            className={`flex-1 py-2 rounded-full items-center justify-center ${
              selectedTab === 'payouts' ? 'bg-[#4D44E3] shadow-sm' : ''
            }`}
            onPress={() => setSelectedTab('payouts')}
          >
            <Text
              className={`text-xs font-semibold ${
                selectedTab === 'payouts' ? 'text-white' : 'text-[#3C494C]'
              }`}
            >
              Payout Methods
            </Text>
          </Pressable>

          <Pressable
            className={`flex-1 py-2 rounded-full items-center justify-center ${
              selectedTab === 'history' ? 'bg-[#4D44E3] shadow-sm' : ''
            }`}
            onPress={() => setSelectedTab('history')}
          >
            <Text
              className={`text-xs font-semibold ${
                selectedTab === 'history' ? 'text-white' : 'text-[#3C494C]'
              }`}
            >
              History
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 90 }}
      >
        {/* WanderStay Credits / Wallet Balance Card */}
        <LinearGradient
          colors={['#4D44E3', '#316BF3', '#A5A3FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="rounded-2xl p-4 shadow-md mb-6 relative overflow-hidden"
        >
          {/* Subtle background glow effect */}
          <View className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10" />

          {/* Wallet Header Row */}
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="wallet-outline" size={17} color="#FFFFFF" />
              <Text className="text-xs font-bold text-white/90 uppercase tracking-wider">
                WANDERSTAY WALLET
              </Text>
            </View>
            <View className="px-2.5 py-0.5 rounded-full bg-white/20">
              <Text className="text-[11px] font-bold text-white">Rewards</Text>
            </View>
          </View>

          {/* Balance Row */}
          <View className="mb-3">
            <View className="flex-row items-baseline gap-1">
              <Text className="text-3xl font-extrabold text-white tracking-tight">
                ${wallet.balance.toFixed(2)}
              </Text>
              <Text className="text-xs font-semibold text-white/80">{wallet.currency}</Text>
            </View>
            <Text className="text-xs text-white/90 mt-0.5">
              Credits ready for your next getaway checkout
            </Text>
          </View>

          {/* Auto-apply at checkout toggle */}
          <View className="p-2.5 rounded-xl bg-white/10 flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5 flex-1 pr-2">
              <Ionicons name="sparkles" size={15} color="#FFFFFF" />
              <Text className="text-xs font-semibold text-white">Auto-apply at checkout</Text>
            </View>
            <Switch
              value={autoApply}
              onValueChange={setAutoApply}
              trackColor={{ false: 'rgba(255,255,255,0.3)', true: '#FFFFFF' }}
              thumbColor={autoApply ? '#4D44E3' : '#F4F3F4'}
              ios_backgroundColor="rgba(255,255,255,0.3)"
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
          </View>
        </LinearGradient>

        {/* TAB 1: Payment Methods Content */}
        {selectedTab === 'methods' && (
          <>
            {/* Section: Your Cards & Accounts */}
            <View className="mb-6">
              <View className="flex-row items-center justify-between px-1 mb-2.5">
                <Text className="text-lg font-semibold text-[#131B2E]">Your Cards & Accounts</Text>
                <Pressable
                  className="flex-row items-center gap-1 active:opacity-70"
                  onPress={() => setAddModalVisible(true)}
                >
                  <Ionicons name="add" size={15} color="#4D44E3" />
                  <Text className="text-xs font-semibold text-[#4D44E3]">Add method</Text>
                </Pressable>
              </View>

              {/* Physical Cards */}
              {wallet.cards
                .filter((c) => c.type === 'visa' || c.type === 'mastercard')
                .map((card) => (
                  <View
                    key={card.id}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-borderLight/40 mb-3"
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-3 flex-1 pr-2">
                        {/* Card Brand Badge */}
                        <View className="w-12 h-8 rounded-lg bg-[#E2E7FF] items-center justify-center">
                          {card.type === 'visa' ? (
                            <Text className="text-xs font-extrabold italic text-[#4D44E3]">
                              VISA
                            </Text>
                          ) : (
                            <View className="flex-row items-center -space-x-1.5">
                              <View className="w-3.5 h-3.5 rounded-full bg-[#EB001B]" />
                              <View className="w-3.5 h-3.5 rounded-full bg-[#F79E1B]/90" />
                            </View>
                          )}
                        </View>

                        {/* Title & Expiry */}
                        <View className="flex-1">
                          <Text className="text-base font-semibold text-[#131B2E]">{card.title}</Text>
                          <Text className="text-xs text-[#3C494C] mt-0.5">{card.subtitle}</Text>
                        </View>
                      </View>

                      {/* Options Button */}
                      <Pressable
                        className="w-8 h-8 rounded-full items-center justify-center active:bg-slate-100"
                        onPress={() => handleCardOptions(card)}
                      >
                        <Ionicons name="ellipsis-vertical" size={16} color="#6C797D" />
                      </Pressable>
                    </View>

                    <View className="h-[1px] bg-[#E2E7FF] my-2.5" />

                    {/* Bottom Status / Actions */}
                    <View className="flex-row items-center justify-between">
                      {card.isDefault ? (
                        <View className="flex-row items-center gap-1">
                          <Ionicons name="checkmark-circle" size={13} color="#4D44E3" />
                          <Text className="text-xs font-bold text-[#4D44E3]">
                            Default payment method
                          </Text>
                        </View>
                      ) : (
                        <Text className="text-xs text-[#3C494C]">{card.secondaryText}</Text>
                      )}

                      {card.isDefault ? (
                        <Text className="text-xs text-[#3C494C]">{card.secondaryText}</Text>
                      ) : (
                        <Pressable onPress={() => handleMakeDefault(card.id)}>
                          <Text className="text-xs font-semibold text-[#4D44E3]">Make default</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                ))}

              {/* Digital Wallets Sub-grid */}
              <View className="gap-2">
                {/* Apple Pay */}
                <View className="bg-white rounded-2xl p-4 shadow-sm border border-borderLight/40 flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 rounded-full bg-[#283044] items-center justify-center">
                      <Ionicons name="logo-apple" size={19} color="#FFFFFF" />
                    </View>
                    <View>
                      <Text className="text-base font-semibold text-[#131B2E]">Apple Pay</Text>
                      <Text className="text-xs text-[#3C494C] mt-0.5">Ready for 1-tap checkout</Text>
                    </View>
                  </View>
                  <View className="w-2.5 h-2.5 rounded-full bg-[#4D44E3]" />
                </View>

                {/* PayPal */}
                <View className="bg-white rounded-2xl p-4 shadow-sm border border-borderLight/40 flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 rounded-full bg-[#E2E7FF] items-center justify-center">
                      <Ionicons name="logo-paypal" size={18} color="#4D44E3" />
                    </View>
                    <View>
                      <Text className="text-base font-semibold text-[#131B2E]">PayPal</Text>
                      <Text className="text-xs text-[#3C494C] mt-0.5">alex.morgan@example.com</Text>
                    </View>
                  </View>
                  <View className="w-2.5 h-2.5 rounded-full bg-[#4D44E3]" />
                </View>
              </View>
            </View>

            {/* Section: Host Payouts */}
            <View className="mb-6">
              <View className="flex-row items-center justify-between px-1 mb-2.5">
                <Text className="text-lg font-semibold text-[#131B2E]">Host Payouts</Text>
                <View className="px-2 py-0.5 rounded-full bg-[#EAEDFF]">
                  <Text className="text-[11px] font-bold text-[#4D44E3] uppercase tracking-wider">
                    EARNINGS
                  </Text>
                </View>
              </View>

              <View className="bg-white rounded-2xl p-4 shadow-sm border border-borderLight/40 flex-row items-center justify-between">
                <View className="flex-row items-center gap-3 flex-1 pr-2">
                  <View className="w-10 h-10 rounded-lg bg-[#EAEDFF] items-center justify-center">
                    <Ionicons name="business-outline" size={20} color="#4D44E3" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-[#131B2E]">
                      {wallet.payouts[0]?.bankName} ({wallet.payouts[0]?.accountNumber})
                    </Text>
                    <Text className="text-xs text-[#3C494C] mt-0.5">
                      {wallet.payouts[0]?.accountType}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center gap-1 bg-[#F2F3FF] px-2.5 py-1 rounded-full">
                  <Ionicons name="checkmark-circle" size={13} color="#4D44E3" />
                  <Text className="text-[11px] font-bold text-[#4D44E3]">Active & Verified</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {/* TAB 2: Payout Methods Content */}
        {selectedTab === 'payouts' && (
          <View className="mb-6">
            <View className="flex-row items-center justify-between px-1 mb-2.5">
              <Text className="text-lg font-semibold text-[#131B2E]">Registered Payout Accounts</Text>
              <Pressable
                className="flex-row items-center gap-1 active:opacity-70"
                onPress={() =>
                  Alert.alert('Add Payout Account', 'Direct ACH and Wire payouts available.')
                }
              >
                <Ionicons name="add" size={15} color="#4D44E3" />
                <Text className="text-xs font-semibold text-[#4D44E3]">Add account</Text>
              </Pressable>
            </View>

            {wallet.payouts.map((p) => (
              <View
                key={p.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-borderLight/40 mb-3"
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 rounded-lg bg-[#EAEDFF] items-center justify-center">
                      <Ionicons name="business" size={20} color="#4D44E3" />
                    </View>
                    <View>
                      <Text className="text-base font-semibold text-[#131B2E]">
                        {p.bankName} ({p.accountNumber})
                      </Text>
                      <Text className="text-xs text-[#3C494C] mt-0.5">{p.accountType}</Text>
                    </View>
                  </View>
                  <View className="bg-[#F2F3FF] px-2.5 py-1 rounded-full">
                    <Text className="text-[11px] font-bold text-[#4D44E3]">{p.status}</Text>
                  </View>
                </View>
                <Text className="text-xs text-[#5A6478] leading-4">
                  Payouts are released within 24 hours after host guest check-in.
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* TAB 3: History Content */}
        {selectedTab === 'history' && (
          <View className="mb-6">
            <Text className="text-lg font-semibold text-[#131B2E] px-1 mb-2.5">
              Complete Wallet & Payment History
            </Text>
          </View>
        )}

        {/* Section: Recent Activity (visible in methods & history tabs) */}
        {(selectedTab === 'methods' || selectedTab === 'history') && (
          <View className="mb-6">
            <View className="flex-row items-center justify-between px-1 mb-2.5">
              <Text className="text-lg font-semibold text-[#131B2E]">Recent Activity</Text>
              <Pressable
                className="active:opacity-70"
                onPress={() => setSelectedTab('history')}
              >
                <Text className="text-xs font-semibold text-[#4D44E3]">View all</Text>
              </Pressable>
            </View>

            <View className="bg-white rounded-2xl p-4 shadow-sm border border-borderLight/40">
              {wallet.transactions.map((tx, index) => (
                <React.Fragment key={tx.id}>
                  {index > 0 && <View className="h-[1px] bg-[#E2E7FF] my-2.5" />}
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3 flex-1 pr-2">
                      <View className="w-10 h-10 rounded-full bg-[#E2E7FF] items-center justify-center">
                        <Ionicons
                          name={tx.isCredit ? 'gift-outline' : 'home-outline'}
                          size={18}
                          color="#4D44E3"
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-[#131B2E]" numberOfLines={1}>
                          {tx.title}
                        </Text>
                        <Text className="text-xs text-[#3C494C] mt-0.5">{tx.dateText}</Text>
                      </View>
                    </View>

                    <View className="items-end">
                      <Text
                        className={`text-base font-bold ${
                          tx.isCredit ? 'text-[#4D44E3]' : 'text-[#131B2E]'
                        }`}
                      >
                        {tx.isCredit ? `+$${tx.amount.toFixed(2)}` : `-$${Math.abs(tx.amount).toFixed(2)}`}
                      </Text>

                      {tx.badge === 'Receipt' ? (
                        <Pressable
                          className="mt-0.5"
                          onPress={() => {
                            if (navigation?.navigate) {
                              navigation.navigate('TripReceipt', { bookingId: 'WS-84920' });
                            }
                          }}
                        >
                          <Text className="text-[11px] font-bold text-[#4D44E3]">Receipt</Text>
                        </Pressable>
                      ) : (
                        <Text className="text-[11px] font-bold text-[#3C494C] mt-0.5">
                          {tx.badge}
                        </Text>
                      )}
                    </View>
                  </View>
                </React.Fragment>
              ))}
            </View>
          </View>
        )}

        {/* Security & Compliance Banner */}
        <View className="p-4 rounded-xl bg-[#F2F3FF] border border-borderLight/40 flex-row items-start gap-3 mb-4">
          <Ionicons name="shield-checkmark" size={18} color="#4D44E3" className="mt-0.5" />
          <Text className="text-xs text-[#3C494C] leading-4 flex-1">
            PCI-DSS Compliant 256-bit SSL encrypted payment processing. Your financial data is securely tokenized.
          </Text>
        </View>
      </ScrollView>

      {/* Primary Sticky Bottom Button */}
      <View className="absolute bottom-0 left-0 right-0 p-4 bg-[#FAF8FF]/95 border-t border-borderLight/40">
        <Pressable
          className="w-full h-12 rounded-full bg-[#4D44E3] flex-row items-center justify-center gap-2 shadow-md active:opacity-90"
          onPress={() => setAddModalVisible(true)}
        >
          <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
          <Text className="text-sm font-semibold text-white">Add Payment Method</Text>
        </Pressable>
      </View>

      {/* Add Payment Method Modal */}
      <Modal visible={addModalVisible} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 shadow-2xl">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-textMain">Add Payment Method</Text>
              <Pressable
                className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
                onPress={() => setAddModalVisible(false)}
              >
                <Ionicons name="close" size={18} color="#131B2E" />
              </Pressable>
            </View>

            {/* Method Type Selector */}
            <View className="flex-row gap-2 mb-4">
              <Pressable
                className={`flex-1 py-2 rounded-xl items-center border ${
                  cardType === 'visa'
                    ? 'border-[#4D44E3] bg-[#E2E7FF]/40'
                    : 'border-borderLight bg-white'
                }`}
                onPress={() => setCardType('visa')}
              >
                <Text
                  className={`text-xs font-bold ${
                    cardType === 'visa' ? 'text-[#4D44E3]' : 'text-textMuted'
                  }`}
                >
                  Visa
                </Text>
              </Pressable>

              <Pressable
                className={`flex-1 py-2 rounded-xl items-center border ${
                  cardType === 'mastercard'
                    ? 'border-[#4D44E3] bg-[#E2E7FF]/40'
                    : 'border-borderLight bg-white'
                }`}
                onPress={() => setCardType('mastercard')}
              >
                <Text
                  className={`text-xs font-bold ${
                    cardType === 'mastercard' ? 'text-[#4D44E3]' : 'text-textMuted'
                  }`}
                >
                  Mastercard
                </Text>
              </Pressable>

              <Pressable
                className={`flex-1 py-2 rounded-xl items-center border ${
                  cardType === 'paypal'
                    ? 'border-[#4D44E3] bg-[#E2E7FF]/40'
                    : 'border-borderLight bg-white'
                }`}
                onPress={() => setCardType('paypal')}
              >
                <Text
                  className={`text-xs font-bold ${
                    cardType === 'paypal' ? 'text-[#4D44E3]' : 'text-textMuted'
                  }`}
                >
                  PayPal
                </Text>
              </Pressable>
            </View>

            {cardType === 'paypal' ? (
              <View className="mb-4">
                <Text className="text-xs font-semibold text-[#6C797D] mb-1">PayPal Email Address</Text>
                <TextInput
                  placeholder="alex.morgan@example.com"
                  placeholderTextColor="#8A90A6"
                  keyboardType="email-address"
                  value={cardHolder}
                  onChangeText={setCardHolder}
                  className="h-11 rounded-xl bg-[#F8F7FF] px-4 border border-borderLight text-sm text-[#131B2E]"
                />
              </View>
            ) : (
              <View className="gap-3 mb-4">
                <View>
                  <Text className="text-xs font-semibold text-[#6C797D] mb-1">Card Number</Text>
                  <TextInput
                    placeholder="4242 •••• •••• 4242"
                    placeholderTextColor="#8A90A6"
                    keyboardType="number-pad"
                    maxLength={19}
                    value={cardNumber}
                    onChangeText={setCardNumber}
                    className="h-11 rounded-xl bg-[#F8F7FF] px-4 border border-borderLight text-sm text-[#131B2E]"
                  />
                </View>

                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Text className="text-xs font-semibold text-[#6C797D] mb-1">Expiration</Text>
                    <TextInput
                      placeholder="MM/YY"
                      placeholderTextColor="#8A90A6"
                      maxLength={5}
                      value={cardExpiry}
                      onChangeText={setCardExpiry}
                      className="h-11 rounded-xl bg-[#F8F7FF] px-4 border border-borderLight text-sm text-[#131B2E]"
                    />
                  </View>

                  <View className="flex-1">
                    <Text className="text-xs font-semibold text-[#6C797D] mb-1">CVV</Text>
                    <TextInput
                      placeholder="123"
                      placeholderTextColor="#8A90A6"
                      keyboardType="number-pad"
                      maxLength={4}
                      secureTextEntry
                      value={cardCvv}
                      onChangeText={setCardCvv}
                      className="h-11 rounded-xl bg-[#F8F7FF] px-4 border border-borderLight text-sm text-[#131B2E]"
                    />
                  </View>
                </View>

                <View>
                  <Text className="text-xs font-semibold text-[#6C797D] mb-1">Cardholder Name</Text>
                  <TextInput
                    placeholder="Alex Morgan"
                    placeholderTextColor="#8A90A6"
                    value={cardHolder}
                    onChangeText={setCardHolder}
                    className="h-11 rounded-xl bg-[#F8F7FF] px-4 border border-borderLight text-sm text-[#131B2E]"
                  />
                </View>
              </View>
            )}

            <Pressable
              className="h-12 rounded-full bg-[#4D44E3] items-center justify-center shadow-md active:opacity-90"
              onPress={handleAddPaymentMethod}
            >
              <Text className="text-sm font-semibold text-white">Save Payment Method</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
