import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function RatingReviewModal({
  visible,
  partnerName,
  starRating,
  setStarRating,
  farmerReview,
  setFarmerReview,
  ratingSubmitting,
  onSubmitRating,
  onClose,
  isUrdu,
  isDark,
  colors
}) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
      }}>
        <View style={{
          width: '100%',
          maxWidth: 400,
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          borderRadius: 24,
          padding: 24,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0'
        }}>
          {/* Star Icon Badge */}
          <View style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: '#FEF3C7',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 12,
            borderWidth: 2,
            borderColor: '#FDE68A'
          }}>
            <MaterialCommunityIcons name="star" size={32} color="#D97706" />
          </View>

          <Text style={{ fontSize: 17, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', marginBottom: 4 }}>
            {isUrdu ? 'ڈاکٹر کو ریویو اور ریٹنگ دیں' : 'Rate Your Consultation'}
          </Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, textAlign: 'center', marginBottom: 16 }}>
            {isUrdu ? `ڈاکٹر ${partnerName} کے ساتھ آپ کا تجربہ کیسا رہا؟` : `How was your medical consultation with ${partnerName}?`}
          </Text>

          {/* Interactive Stars */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setStarRating(star)}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              >
                <MaterialCommunityIcons
                  name={star <= starRating ? 'star' : 'star-outline'}
                  size={36}
                  color={star <= starRating ? '#F59E0B' : (isDark ? '#475569' : '#CBD5E1')}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Feedback Input */}
          <TextInput
            style={{
              width: '100%',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC',
              borderRadius: 12,
              padding: 12,
              fontSize: 13,
              color: colors.textPrimary,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
              minHeight: 65,
              textAlignVertical: 'top',
              marginBottom: 16
            }}
            placeholder={isUrdu ? 'اپنا فیڈ بیک اور رائے لکھیں...' : 'Share feedback about response time and diagnosis quality...'}
            placeholderTextColor={colors.textSecondary}
            multiline
            value={farmerReview}
            onChangeText={setFarmerReview}
          />

          {/* Submit & Dismiss Row */}
          <View style={{ flexDirection: 'row', width: '100%', gap: 10 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
                alignItems: 'center'
              }}
              onPress={onClose}
            >
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary }}>
                {isUrdu ? 'بعد میں' : 'Later'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1.5,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: '#059669',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onPress={onSubmitRating}
              disabled={ratingSubmitting}
            >
              {ratingSubmitting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#FFF' }}>
                  {isUrdu ? 'ریٹنگ جمع کروائیں' : 'Submit Review'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
