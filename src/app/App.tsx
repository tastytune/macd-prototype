import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AssetViewer } from './components/AssetViewer';
import { Step2ReviewOrder } from './components/Step2ReviewOrder';
import { Step5Success } from './components/Step5Success';
import { DispatcherStep1 } from './components/DispatcherStep1';
import { DispatcherStep2 } from './components/DispatcherStep2';
import { ReactivateServices } from './components/ReactivateServices';
import { ReactivateReviewOrder } from './components/ReactivateReviewOrder';
import { DeactivateServices } from './components/DeactivateServices';
import { DeactivateReviewOrder } from './components/DeactivateReviewOrder';
import { MoveServices } from './components/MoveServices';
import { MoveServiceType } from './components/MoveServiceType';
import { MoveServicesStep3 } from './components/MoveServicesStep3';
import { MoveServicesStep4 } from './components/MoveServicesStep4';
import { MoveServicesStep5 } from './components/MoveServicesStep5';
import { ChangeServiceType } from './components/ChangeServiceType';
import { ChangeInternetPlan } from './components/ChangeInternetPlan';
import { ChangeTelevisionPlan } from './components/ChangeTelevisionPlan';
import { ChangePhonePlan } from './components/ChangePhonePlan';
import { ChangeInstallationDate } from './components/ChangeInstallationDate';
import { ChangeReviewOrder } from './components/ChangeReviewOrder';
import type { MACDAction } from './components/DispatcherStep1';

export interface Service {
  id: string;
  name: string;
  status: string;
  address?: string;
  children?: Service[];
}

export interface SelectedChildItem {
  id: string;
  name: string;
  parentServiceId: string;
  parentServiceName: string;
}

export interface OrderItem {
  id: string;
  serviceId: string;
  serviceName: string;
  description: string;
  quantity: number;
  monthlyCharge: number;
}

export interface CartLine {
  label: string;
  price: number;
  group: 'internet' | 'television' | 'phone';
}

const SA_INITIAL_CART: Record<string, CartLine[]> = {
  'sa-00912': [
    { label: 'Internet 2 Gbps',         price: 124.95, group: 'internet'    },
    { label: 'Whole Home Wi-Fi',        price:   5.95, group: 'internet'    },
    { label: 'iTV Preferred',           price:  79.95, group: 'television'  },
    { label: 'Cinemax',                 price:  12.99, group: 'television'  },
    { label: 'FANatic',                 price:   5.99, group: 'television'  },
  ],
  'sa-01047': [
    { label: 'Internet 200 Mbps',       price:  55.95, group: 'internet'    },
    { label: 'Whole Home Wi-Fi',        price:   5.95, group: 'internet'    },
    { label: 'Unlimited Local Calling', price:  15.95, group: 'phone'       },
  ],
  'sa-02031': [
    { label: 'Phone Standalone',        price:  17.50, group: 'phone'       },
  ],
};

// Define the services structure for mapping child items
const servicesData: Service[] = [
  {
    id: 'internet',
    name: 'Residential Internet',
    status: 'Active',
    children: [
      { id: 'internet-assurance', name: 'Service Assurance', status: 'Active' },
      { id: 'internet-installation', name: 'Installation Fees', status: 'Active' },
      { id: 'internet-support', name: 'Tech Home Support', status: 'Active' }
    ]
  },
  {
    id: 'phone',
    name: 'Phone',
    status: 'Active',
    children: [
      { id: 'phone-voice', name: 'Voice', status: 'Active' },
      { id: 'phone-longdistance', name: 'Long Distance', status: 'Active' },
      { id: 'phone-directory', name: 'Directory Listing', status: 'Active' },
      { id: 'phone-callerid', name: 'Caller ID', status: 'Active' },
      { id: 'phone-callwaiting', name: 'Call Waiting', status: 'Active' },
      { id: 'phone-voicemail', name: 'Voice Mail', status: 'Active' }
    ]
  },
  {
    id: 'tv',
    name: 'iTV Extra',
    status: 'Active',
    children: [
      { id: 'tv-streams', name: 'Number Of Streams', status: 'Active' },
      { id: 'tv-devices', name: 'Streaming Devices', status: 'Active' },
      { id: 'tv-dvr', name: 'DVR Hours', status: 'Active' },
      { id: 'tv-broadcaster', name: 'Broadcaster Fee', status: 'Active' },
      { id: 'tv-connectivity', name: 'Connectivity Fee', status: 'Active' },
      { id: 'tv-music', name: 'Digital Music Channel', status: 'Active' },
      { id: 'tv-cinemax', name: 'Cinemax', status: 'Active' },
      { id: 'tv-hbo', name: 'HBO', status: 'Active' }
    ]
  }
];

type Step = 'dispatcher-step1' | 'dispatcher-step2' | 'viewer' | 'reactivate-services' | 'reactivate-review' | 'deactivate-services' | 'deactivate-review' | 'move-services' | 'move-service-type' | 'move-services-step3' | 'move-dates' | 'move-review' | 'change-service-type' | 'change-internet-plan' | 'change-television-plan' | 'change-phone-plan' | 'change-installation-date' | 'change-review' | 'step2' | 'step5';

function App() {
  const [currentStep, setCurrentStep] = useState<Step>('dispatcher-step1');
  const [selectedAction, setSelectedAction] = useState<MACDAction | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [_selectedChildItems, setSelectedChildItems] = useState<SelectedChildItem[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedSA, setSelectedSA] = useState<Service | null>(null);
  const [reactivationDate, setReactivationDate] = useState<string>('');
  const [reactivationReason, setReactivationReason] = useState<string>('');
  const [selectedBAId, setSelectedBAId] = useState<string>('');
  const [orderReference, setOrderReference] = useState<string>('');
  const [disconnectionDate, setDisconnectionDate] = useState<string>('');
  const [deactivateSelectedIds, setDeactivateSelectedIds] = useState<string[]>([]);
  const [deactivateReason, setDeactivateReason] = useState<string>('');
  const [disconnectionReason, setDisconnectionReason] = useState<string>('');
  const [disconnectionComments, setDisconnectionComments] = useState<string>('');
  const [moveScenario, setMoveScenario] = useState<string>('M01');
  const [moveDestinationAddress, setMoveDestinationAddress] = useState<string>('');
  const [moveSelectedServiceIds, setMoveSelectedServiceIds] = useState<string[]>(['fiber', 'voice', 'streaming', 'wifi']);
  const [changeInstallationDate, setChangeInstallationDate] = useState<string>('');
  const [changeInstallationSlot, setChangeInstallationSlot] = useState<string>('');
  const [changeCartLines, setChangeCartLines] = useState<CartLine[]>([]);
  const [changeInternetPlanId, setChangeInternetPlanId] = useState<string>('');
  const [changeSelectedPromos, setChangeSelectedPromos] = useState<Set<string>>(new Set());
  const toggleChangePromo = (id: string) => setChangeSelectedPromos(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
  });
  const PHONE_STANDALONE_SAS = new Set(['sa-02031']);
  const SA_INET_PLAN: Record<string, string> = { 'sa-00912': '2gig', 'sa-01047': '200mbps' };
  const PLAN_IDX: Record<string, number> = { '200mbps': 0, '1gig': 1, '2gig': 2 };
  const SA_HAS_PRICE_LOCK = new Set(['sa-00912', 'sa-01047']);
  const changeIsDowngrade = !!changeInternetPlanId && (PLAN_IDX[changeInternetPlanId] ?? 0) < (PLAN_IDX[SA_INET_PLAN[selectedSA?.id ?? ''] ?? '200mbps'] ?? 0);
  // isUpgrade: internet was upgraded, OR internet untouched but SA has active Price Lock
  const changeIsUpgrade = (!!changeInternetPlanId && (PLAN_IDX[changeInternetPlanId] ?? 0) > (PLAN_IDX[SA_INET_PLAN[selectedSA?.id ?? ''] ?? '200mbps'] ?? 0))
    || (!changeInternetPlanId && SA_HAS_PRICE_LOCK.has(selectedSA?.id ?? ''));
  const [moveBillingEndDate, setMoveBillingEndDate] = useState<string>('');
  const [moveInstallationDate, setMoveInstallationDate] = useState<string>('');
  const [moveTimeSlot, setMoveTimeSlot] = useState<string>('');

  const calculateTotalActiveMonthlyCharges = () => {
    const internetTotal = 12.99 + 3.50;
    const phoneTotal = 25.00 + 3.00 + 8.00 + 6.00 + 7.00;
    const tvTotal = (3 * 5.00) + 10.00 + 20.00 + 12.00 + 9.99 + 15.00 + 18.00;
    const saId = selectedSA?.id ?? '';
    if (saId === 'sa-01047') return internetTotal + phoneTotal; // Internet + Phone
    return internetTotal + tvTotal; // Internet + iTV (sa-00912 / default)
  };

  const generateOrderItemsForService = (service: Service): OrderItem[] => {
    const items: OrderItem[] = [];
    if (service.id === 'internet') {
      items.push(
        { id: '1', serviceId: 'internet', serviceName: 'Residential Internet', description: 'Service Assurance', quantity: 1, monthlyCharge: 12.99 },
        { id: '2', serviceId: 'internet', serviceName: 'Residential Internet', description: 'Installation Fees', quantity: 1, monthlyCharge: 0.00 },
        { id: '3', serviceId: 'internet', serviceName: 'Residential Internet', description: 'Tech Home Support', quantity: 1, monthlyCharge: 3.50 }
      );
    } else if (service.id === 'phone') {
      items.push(
        { id: '4', serviceId: 'phone', serviceName: 'Phone', description: 'Voice', quantity: 1, monthlyCharge: 25.00 },
        { id: '5', serviceId: 'phone', serviceName: 'Phone', description: 'Long Distance', quantity: 0, monthlyCharge: 0.00 },
        { id: '6', serviceId: 'phone', serviceName: 'Phone', description: 'Directory Listing', quantity: 1, monthlyCharge: 3.00 },
        { id: '7', serviceId: 'phone', serviceName: 'Phone', description: 'Caller ID', quantity: 1, monthlyCharge: 8.00 },
        { id: '8', serviceId: 'phone', serviceName: 'Phone', description: 'Call Waiting', quantity: 1, monthlyCharge: 6.00 },
        { id: '9', serviceId: 'phone', serviceName: 'Phone', description: 'Voice Mail', quantity: 1, monthlyCharge: 7.00 }
      );
    } else if (service.id === 'tv') {
      items.push(
        { id: '10', serviceId: 'tv', serviceName: 'iTV Extra', description: 'Number Of Streams', quantity: 3, monthlyCharge: 5.00 },
        { id: '11', serviceId: 'tv', serviceName: 'iTV Extra', description: 'Streaming Devices', quantity: 1, monthlyCharge: 10.00 },
        { id: '12', serviceId: 'tv', serviceName: 'iTV Extra', description: 'DVR Hours', quantity: 1, monthlyCharge: 20.00 },
        { id: '13', serviceId: 'tv', serviceName: 'iTV Extra', description: 'Broadcaster Fee', quantity: 1, monthlyCharge: 12.00 },
        { id: '14', serviceId: 'tv', serviceName: 'iTV Extra', description: 'Connectivity Fee', quantity: 1, monthlyCharge: 0.00 },
        { id: '15', serviceId: 'tv', serviceName: 'iTV Extra', description: 'Digital Music Channel', quantity: 1, monthlyCharge: 9.99 },
        { id: '16', serviceId: 'tv', serviceName: 'iTV Extra', description: 'Cinemax', quantity: 1, monthlyCharge: 15.00 },
        { id: '17', serviceId: 'tv', serviceName: 'iTV Extra', description: 'HBO', quantity: 1, monthlyCharge: 18.00 }
      );
    }
    return items;
  };

  const generateOrderItemsForChildItems = (childItemIds: string[]): OrderItem[] => {
    const childItemToOrderItemMap: { [key: string]: OrderItem } = {
      'internet-assurance': { id: '1', serviceId: 'internet', serviceName: 'Residential Internet', description: 'Service Assurance', quantity: 1, monthlyCharge: 12.99 },
      'internet-installation': { id: '2', serviceId: 'internet', serviceName: 'Residential Internet', description: 'Installation Fees', quantity: 1, monthlyCharge: 0.00 },
      'internet-support': { id: '3', serviceId: 'internet', serviceName: 'Residential Internet', description: 'Tech Home Support', quantity: 1, monthlyCharge: 3.50 },
      'phone-voice': { id: '4', serviceId: 'phone', serviceName: 'Phone', description: 'Voice', quantity: 1, monthlyCharge: 25.00 },
      'phone-longdistance': { id: '5', serviceId: 'phone', serviceName: 'Phone', description: 'Long Distance', quantity: 0, monthlyCharge: 0.00 },
      'phone-directory': { id: '6', serviceId: 'phone', serviceName: 'Phone', description: 'Directory Listing', quantity: 1, monthlyCharge: 3.00 },
      'phone-callerid': { id: '7', serviceId: 'phone', serviceName: 'Phone', description: 'Caller ID', quantity: 1, monthlyCharge: 8.00 },
      'phone-callwaiting': { id: '8', serviceId: 'phone', serviceName: 'Phone', description: 'Call Waiting', quantity: 1, monthlyCharge: 6.00 },
      'phone-voicemail': { id: '9', serviceId: 'phone', serviceName: 'Phone', description: 'Voice Mail', quantity: 1, monthlyCharge: 7.00 },
      'tv-streams': { id: '10', serviceId: 'tv', serviceName: 'iTV Extra', description: 'Number Of Streams', quantity: 3, monthlyCharge: 5.00 },
      'tv-devices': { id: '11', serviceId: 'tv', serviceName: 'iTV Extra', description: 'Streaming Devices', quantity: 1, monthlyCharge: 10.00 },
      'tv-dvr': { id: '12', serviceId: 'tv', serviceName: 'iTV Extra', description: 'DVR Hours', quantity: 1, monthlyCharge: 20.00 },
      'tv-broadcaster': { id: '13', serviceId: 'tv', serviceName: 'iTV Extra', description: 'Broadcaster Fee', quantity: 1, monthlyCharge: 12.00 },
      'tv-connectivity': { id: '14', serviceId: 'tv', serviceName: 'iTV Extra', description: 'Connectivity Fee', quantity: 1, monthlyCharge: 0.00 },
      'tv-music': { id: '15', serviceId: 'tv', serviceName: 'iTV Extra', description: 'Digital Music Channel', quantity: 1, monthlyCharge: 9.99 },
      'tv-cinemax': { id: '16', serviceId: 'tv', serviceName: 'iTV Extra', description: 'Cinemax', quantity: 1, monthlyCharge: 15.00 },
      'tv-hbo': { id: '17', serviceId: 'tv', serviceName: 'iTV Extra', description: 'HBO', quantity: 1, monthlyCharge: 18.00 }
    };

    return childItemIds
      .map(id => childItemToOrderItemMap[id])
      .filter(Boolean);
  };

  // ── Dispatcher handlers ──────────────────────────────────────

  const handleDispatcherAction = (action: MACDAction) => {
    setSelectedAction(action);
    setCurrentStep('dispatcher-step2');
  };

  const handleDispatcherAccounts = (services: Service[], childItemIds: string[]) => {
    if (selectedAction === 'move') {
      setSelectedSA(services[0]);
      setSelectedService(services[0]);
      setCurrentStep('move-services');
    } else if (selectedAction === 'move2') {
      setSelectedSA(services[0]);
      setSelectedService(services[0]);
      setChangeCartLines(SA_INITIAL_CART[services[0].id] ?? []);
      setChangeInternetPlanId('');
      setChangeSelectedPromos(new Set());
      setCurrentStep('move-services');
    } else if (selectedAction === 'change') {
      setSelectedSA(services[0]);
      setSelectedService(services[0]);
      setChangeCartLines(SA_INITIAL_CART[services[0].id] ?? []);
      setChangeInternetPlanId('');
      setChangeSelectedPromos(new Set());
      setCurrentStep('change-service-type');
    } else if (selectedAction === 'disconnect') {
      setSelectedSA(services[0]);
      setCurrentStep('viewer');
    } else if (selectedAction === 'reactivate') {
      const baLabel = childItemIds.map(id => id.toUpperCase()).join(', ');
      const baService: Service = { id: 'billing', name: baLabel || 'Billing accounts', status: 'Active' };
      setSelectedSA(baService);
      setSelectedService(baService);
      setSelectedBAId(childItemIds[0] ?? '');
      setCurrentStep('reactivate-services');
    } else {
      // Deactivate: go to deactivate-services step
      const baLabel = childItemIds.map(id => id.toUpperCase().replace('BA-', 'BA-')).join(', ');
      const baService: Service = { id: 'billing', name: baLabel || 'Billing accounts', status: 'Active' };
      setSelectedSA(baService);
      setSelectedService(baService);
      setSelectedBAId(childItemIds[0] ?? '');
      const baOrderItems: OrderItem[] = childItemIds.map((baId, i) => ({
        id: String(i + 100),
        serviceId: baId,
        serviceName: baId.toUpperCase(),
        description: baId === 'ba-00391' ? 'Primary billing' : baId === 'ba-00412' ? 'Equipment lease' : 'Primary billing',
        quantity: 1,
        monthlyCharge: baId === 'ba-00391' ? 189.00 : baId === 'ba-00412' ? 14.99 : 79.00,
      }));
      setOrderItems(baOrderItems);
      setCurrentStep('deactivate-services');
    }
  };

  // ── Existing flow handlers ──────────────────────

  const handleNext = (services: Service[], childItemIds: string[], disconnectionDate: string) => {
    setSelectedService(services[0]);

    const childItems: SelectedChildItem[] = [];
    childItemIds.forEach(childId => {
      for (const service of servicesData) {
        const child = service.children?.find(c => c.id === childId);
        if (child) {
          childItems.push({
            id: child.id,
            name: child.name,
            parentServiceId: service.id,
            parentServiceName: service.name
          });
          break;
        }
      }
    });
    setSelectedChildItems(childItems);
    setDisconnectionDate(disconnectionDate);

    let allItems: OrderItem[] = [];
    if (childItemIds.length > 0) {
      allItems = generateOrderItemsForChildItems(childItemIds);
    } else {
      services.forEach(service => {
        allItems.push(...generateOrderItemsForService(service));
      });
    }

    setOrderItems(allItems);
    setCurrentStep('step2');
  };

  const handleRemoveItem = (itemId: string) => {
    setOrderItems(orderItems.filter(item => item.id !== itemId));
  };

  const handleConfirmSubmit = () => {
    const ref = `DC-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    setOrderReference(ref);
    setCurrentStep('step5');
  };

  const handleReturnToAccount = () => {
    setCurrentStep('dispatcher-step1');
    setSelectedAction(null);
    setSelectedService(null);
    setSelectedSA(null);
    setOrderItems([]);
    setOrderReference('');
    setDisconnectionDate('');
  };

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AnimatePresence mode="wait">

        {/* ── DISPATCHER STEP 1: Select action ── */}
        {currentStep === 'dispatcher-step1' && (
          <motion.div
            key="dispatcher-step1"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <DispatcherStep1
              onNext={handleDispatcherAction}
              onCancel={handleReturnToAccount}
            />
          </motion.div>
        )}

        {/* ── DISPATCHER STEP 2: Select accounts ── */}
        {currentStep === 'dispatcher-step2' && selectedAction && (
          <motion.div
            key="dispatcher-step2"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <DispatcherStep2
              action={selectedAction}
              initialSelectedBA={selectedBAId || undefined}
              onNext={handleDispatcherAccounts}
              onBack={() => setCurrentStep('dispatcher-step1')}
            />
          </motion.div>
        )}

        {/* ── D01: Active Services (Disconnect path only) ── */}
        {currentStep === 'viewer' && (
          <motion.div
            key="viewer"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <AssetViewer onNext={handleNext} onBack={() => setCurrentStep('dispatcher-step2')} action={selectedAction} selectedSA={selectedSA} disconnectionReason={disconnectionReason} disconnectionComments={disconnectionComments} onReasonChange={setDisconnectionReason} onCommentsChange={setDisconnectionComments} />
          </motion.div>
        )}

        {/* ── Reactivate Services ── */}
        {currentStep === 'reactivate-services' && (
          <motion.div
            key="reactivate-services"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <ReactivateServices
              action={selectedAction}
              selectedSA={selectedSA}
              baId={orderItems[0]?.serviceId}
              onBack={() => setCurrentStep('dispatcher-step2')}
              onReactivate={(date, reason) => { setReactivationDate(date); setReactivationReason(reason); setCurrentStep('reactivate-review'); }}
            />
          </motion.div>
        )}

        {/* ── Reactivate Review Order ── */}
        {currentStep === 'reactivate-review' && (
          <motion.div
            key="reactivate-review"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="px-8 py-12"
          >
            <div className="max-w-5xl mx-auto">
              <ReactivateReviewOrder
                action={selectedAction}
                selectedSA={selectedSA}
                reactivationDate={reactivationDate}
                reactivationReason={reactivationReason}
                orderItems={orderItems}
                onBack={() => setCurrentStep('reactivate-services')}
                onConfirm={handleConfirmSubmit}
              />
            </div>
          </motion.div>
        )}

        {/* ── Deactivate Services ── */}
        {currentStep === 'deactivate-services' && (
          <motion.div
            key="deactivate-services"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <DeactivateServices
              action={selectedAction}
              selectedSA={selectedSA}
              baId={orderItems[0]?.serviceId}
              initialDate={disconnectionDate || undefined}
              initialSelectedIds={deactivateSelectedIds.length > 0 ? deactivateSelectedIds : undefined}
              initialReason={deactivateReason || undefined}
              onBack={() => setCurrentStep('dispatcher-step2')}
              onDeactivate={(date, ids, reason) => {
                setDisconnectionDate(date);
                setDeactivateSelectedIds(ids);
                setDeactivateReason(reason);
                setCurrentStep('deactivate-review');
              }}
            />
          </motion.div>
        )}

        {/* ── Deactivate Review Order ── */}
        {currentStep === 'deactivate-review' && (
          <motion.div
            key="deactivate-review"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="px-8 py-12"
          >
            <div className="max-w-5xl mx-auto">
              <DeactivateReviewOrder
                action={selectedAction}
                selectedSA={selectedSA}
                deactivationDate={disconnectionDate}
                selectedServiceIds={deactivateSelectedIds}
                deactivationReason={deactivateReason}
                orderItems={orderItems}
                onBack={() => setCurrentStep('deactivate-services')}
                onConfirm={handleConfirmSubmit}
              />
            </div>
          </motion.div>
        )}

        {/* ── Move Services ── */}
        {currentStep === 'move-services' && (
          <motion.div
            key="move-services"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <MoveServices
              action={selectedAction}
              selectedSA={selectedSA}
              isMove2={selectedAction === 'move2'}
              onBack={() => setCurrentStep('dispatcher-step2')}
              onMove={(address, scenario) => {
                setMoveDestinationAddress(address);
                setMoveScenario(scenario || 'M01');
                setCurrentStep(selectedAction === 'move2' ? 'change-service-type' : 'move-service-type');
              }}
            />
          </motion.div>
        )}

        {/* ── Move: What would you like to move? ── */}
        {currentStep === 'move-service-type' && (
          <motion.div
            key="move-service-type"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <MoveServiceType
              action={selectedAction}
              selectedSA={selectedSA}
              onBack={() => setCurrentStep('move-services')}
              onNext={(ids) => { setMoveSelectedServiceIds(ids); setCurrentStep('move-dates'); }}
            />
          </motion.div>
        )}

        {/* ── Move Services Step 3: Services selection (M03/M04 legacy) ── */}
        {currentStep === 'move-services-step3' && (
          <motion.div
            key="move-services-step3"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <MoveServicesStep3
              scenario={moveScenario}
              selectedSA={selectedSA}
              onBack={() => setCurrentStep('move-services')}
              onNext={(ids) => { setMoveSelectedServiceIds(ids); setCurrentStep('move-dates'); }}
            />
          </motion.div>
        )}

        {/* ── Move Services Step 4: Dates ── */}
        {currentStep === 'move-dates' && (
          <motion.div
            key="move-dates"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <MoveServicesStep4
              scenario={moveScenario}
              selectedSA={selectedSA}
              selectedServiceIds={moveSelectedServiceIds}
              onBack={() => setCurrentStep('move-services-step3')}
              onNext={(billingEnd, installation, timeSlot) => { setMoveBillingEndDate(billingEnd); setMoveInstallationDate(installation); setMoveTimeSlot(timeSlot); setCurrentStep('move-review'); }}
            />
          </motion.div>
        )}

        {/* ── Move Services Step 5: Review ── */}
        {currentStep === 'move-review' && (
          <motion.div
            key="move-review"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <MoveServicesStep5
              scenario={moveScenario}
              selectedSA={selectedSA}
              destinationAddress={moveDestinationAddress}
              selectedServiceIds={moveSelectedServiceIds}
              billingEndDate={moveBillingEndDate}
              installationDate={moveInstallationDate}
              timeSlot={moveTimeSlot}
              onBack={() => setCurrentStep('move-dates')}
              onSubmit={() => handleConfirmSubmit()}
            />
          </motion.div>
        )}

        {/* ── Change: Service type selection ── */}
        {currentStep === 'change-service-type' && (
          <motion.div
            key="change-service-type"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <ChangeServiceType
              selectedSA={selectedSA}
              isMove2={selectedAction === 'move2'}
              onBack={() => setCurrentStep(selectedAction === 'move2' ? 'move-services' : 'dispatcher-step2')}
              onNext={(serviceType) => {
                if (serviceType === 'television') setCurrentStep('change-television-plan');
                else if (serviceType === 'phone') setCurrentStep('change-phone-plan');
                else setCurrentStep('change-internet-plan');
              }}
            />
          </motion.div>
        )}

        {/* ── Change: Internet plan selection ── */}
        {currentStep === 'change-internet-plan' && (
          <motion.div
            key="change-internet-plan"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <ChangeInternetPlan
              selectedSA={selectedSA}
              previousLines={changeCartLines}
              isDowngrade={changeIsDowngrade}
              isMove2={selectedAction === 'move2'}
              isCoaxMove={selectedAction === 'move2' && moveScenario === 'M03'}
              selectedPromos={changeSelectedPromos}
              onPromoToggle={toggleChangePromo}
              onBack={() => setCurrentStep('change-service-type')}
              onSkip={() => { setChangeInternetPlanId(''); setCurrentStep('change-television-plan'); }}
              onNext={(planId, _addOns, lines) => { setChangeCartLines(lines); setChangeInternetPlanId(planId); setCurrentStep('change-television-plan'); }}
            />
          </motion.div>
        )}

        {/* ── Change: Television plan selection ── */}
        {currentStep === 'change-television-plan' && (
          <motion.div
            key="change-television-plan"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <ChangeTelevisionPlan
              selectedSA={selectedSA}
              selectedInternetPlanId={changeInternetPlanId}
              previousLines={changeCartLines}
              isDowngrade={changeIsDowngrade}
              isUpgrade={changeIsUpgrade}
              isMove2={selectedAction === 'move2'}
              selectedPromos={changeSelectedPromos}
              onPromoToggle={toggleChangePromo}
              onBack={() => setCurrentStep('change-internet-plan')}
              onSkip={() => setCurrentStep('change-phone-plan')}
              onNext={(_planId, _addOns, lines) => { setChangeCartLines(lines); setCurrentStep('change-phone-plan'); }}
            />
          </motion.div>
        )}

        {/* ── Change: Phone plan selection ── */}
        {currentStep === 'change-phone-plan' && (
          <motion.div
            key="change-phone-plan"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <ChangePhonePlan
              selectedSA={selectedSA}
              previousLines={changeCartLines}
              isDowngrade={changeIsDowngrade}
              isUpgrade={changeIsUpgrade}
              isMove2={selectedAction === 'move2'}
              isPhoneStandalone={PHONE_STANDALONE_SAS.has(selectedSA?.id ?? '')}
              selectedPromos={changeSelectedPromos}
              onPromoToggle={toggleChangePromo}
              onBack={() => setCurrentStep('change-television-plan')}
              onSkip={() => setCurrentStep('change-installation-date')}
              onNext={(_planId, lines) => { setChangeCartLines(lines); setCurrentStep('change-installation-date'); }}
            />
          </motion.div>
        )}

        {/* ── Change: Installation Date ── */}
        {currentStep === 'change-installation-date' && (
          <motion.div
            key="change-installation-date"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <ChangeInstallationDate
              selectedSA={selectedSA}
              cartLines={changeCartLines}
              isDowngrade={changeIsDowngrade}
              isUpgrade={changeIsUpgrade}
              isMove2={selectedAction === 'move2'}
              selectedPromos={changeSelectedPromos}
              onPromoToggle={toggleChangePromo}
              onBack={() => setCurrentStep('change-phone-plan')}
              onSkip={() => { setChangeInstallationDate(''); setChangeInstallationSlot(''); setCurrentStep('change-review'); }}
              onNext={(date, slot) => { setChangeInstallationDate(date); setChangeInstallationSlot(slot); setCurrentStep('change-review'); }}
            />
          </motion.div>
        )}

        {/* ── Change: Review Order ── */}
        {currentStep === 'change-review' && (
          <motion.div
            key="change-review"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="px-8 py-12"
          >
            <div className="max-w-5xl mx-auto">
              <ChangeReviewOrder
                action={selectedAction}
                selectedSA={selectedSA}
                installationDate={changeInstallationDate}
                installationSlot={changeInstallationSlot}
                cartLines={changeCartLines}
                isDowngrade={changeIsDowngrade}
                isUpgrade={changeIsUpgrade}
                isMove2={selectedAction === 'move2'}
                selectedPromos={changeSelectedPromos}
                onPromoToggle={toggleChangePromo}
                onBack={() => setCurrentStep('change-installation-date')}
                onConfirm={() => setCurrentStep('step5')}
              />
            </div>
          </motion.div>
        )}

        {/* ── D02–D04: Review Order ── */}
        {currentStep === 'step2' && selectedService && (
          <motion.div
            key="step2"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="px-8 py-12"
          >
            <div className="max-w-5xl mx-auto">
              <Step2ReviewOrder
                orderItems={orderItems}
                service={selectedService}
                disconnectionDate={disconnectionDate}
                totalActiveMonthlyCharges={calculateTotalActiveMonthlyCharges()}
                disconnectionReason={disconnectionReason}
                disconnectionComments={disconnectionComments}
                onReasonChange={setDisconnectionReason}
                onCommentsChange={setDisconnectionComments}
                onRemoveItem={handleRemoveItem}
                onDisconnectionDateChange={setDisconnectionDate}
                onBack={() => setCurrentStep(selectedAction === 'deactivate' ? 'deactivate-services' : 'viewer')}
                onContinue={handleConfirmSubmit}
                action={selectedAction}
                selectedSA={selectedSA}
              />
            </div>
          </motion.div>
        )}

        {/* ── D05: Success ── */}
        {currentStep === 'step5' && selectedService && (
          <motion.div
            key="step5"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <Step5Success
              service={selectedService}
              orderReference={orderReference}
              orderItems={orderItems}
              onReturn={handleReturnToAccount}
              action={selectedAction}
              selectedSA={selectedSA}
              installationDate={(selectedAction === 'move' || selectedAction === 'move2') ? (moveInstallationDate || changeInstallationDate) : changeInstallationDate}
              installationSlot={changeInstallationSlot}
              billingEndDate={moveBillingEndDate}
              timeSlot={moveTimeSlot}
              destinationAddress={(selectedAction === 'move' || selectedAction === 'move2') ? moveDestinationAddress : undefined}
            />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

export default App;
