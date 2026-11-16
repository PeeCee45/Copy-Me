import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet,
  AppState, Platform, StatusBar, useColorScheme, ScrollView,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Device from 'expo-device';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

const ORANGE = '#E4572E';
const themes = {
  light: { bg: '#F6F5F1', card: '#FFFFFF', text: '#1C1B19', muted: '#6B6862', line: '#E3E0D8', input: '#F1EFE9', accent: ORANGE, ok: '#2E9E5B' },
  dark: { bg: '#161512', card: '#201F1C', text: '#F1EFE9', muted: '#9A968D', line: '#35332E', input: '#2A2824', accent: '#FF7A4D', ok: '#4CC27C' },
};

function Logo({ size = 44 }) {
  const sheet = { position: 'absolute', width: size * 0.36, height: size * 0.44, borderRadius: size * 0.07 };
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.26, backgroundColor: ORANGE }}>
      <View style={[sheet, { backgroundColor: 'rgba(255,255,255,0.55)', left: size * 0.4, top: size * 0.16 }]} />
      <View style={[sheet, { backgroundColor: '#fff', left: size * 0.24, top: size * 0.34 }]} />
    </View>
  );
}

function Field({ label, s, c, ...props }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput style={s.input} placeholderTextColor={c.muted} selectionColor={c.accent} {...props} />
    </View>
  );
}

export default function App() {
  const scheme = useColorScheme();
  const c = themes[scheme === 'dark' ? 'dark' : 'light'];
  const s = useMemo(() => makeStyles(c), [scheme]);

  const [host, setHost] = useState('');
  const [pin, setPin] = useState('');
  const [name, setName] = useState(Device.deviceName || Device.modelName || 'My phone');
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [devices, setDevices] = useState([]);
  const [feed, setFeed] = useState([]);
  const ws = useRef(null);
  const last = useRef('');
  const seen = useRef(new Set());
  const myId = useRef(Math.random().toString(36).slice(2) + Date.now().toString(36));
  const wantOn = useRef(false);
  const lastPong = useRef(0);
  const retry = useRef(null);

  const newId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
  const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const addFeed = (kind, text) => setFeed(f => [{ id: newId(), kind, text, t: now() }, ...f].slice(0, 60));

  const connect = () => {
    if (!host.trim()) { addFeed('info', 'Enter the host address first.'); return; }
    wantOn.current = true;
    setConnecting(true);
    clearTimeout(retry.current);
    if (ws.current) { ws.current.onclose = null; try { ws.current.close(); } catch (e) {} }
    const sock = new WebSocket(`ws://${host.trim()}`);
    ws.current = sock;
    sock.onopen = () => sock.send(JSON.stringify({ type: 'hello', pin, id: myId.current, name }));
    sock.onmessage = async e => {
      const m = JSON.parse(e.data);
      if (m.type === 'pong') { lastPong.current = Date.now(); return; }
      if (m.type === 'auth') {
        setConnected(m.ok); setConnecting(false);
        if (m.ok) { lastPong.current = Date.now(); addFeed('info', 'Connected to ' + m.name); }
        else { wantOn.current = false; addFeed('info', m.reason || 'Could not connect'); }
      }
      if (m.type === 'devices') setDevices(m.list);
      if (m.type === 'clip' && !seen.current.has(m.id)) {
        seen.current.add(m.id);
        last.current = m.text;
        await Clipboard.setStringAsync(m.text);
        addFeed('in', m.text);
      }
    };
    sock.onclose = () => {
      setConnected(false);
      if (wantOn.current) { setConnecting(true); retry.current = setTimeout(connect, 3000); }
      else setConnecting(false);
    };
    sock.onerror = () => {};
  };

  const disconnect = () => {
    wantOn.current = false;
    clearTimeout(retry.current);
    if (ws.current) { ws.current.onclose = null; ws.current.close(); }
    setConnected(false); setConnecting(false); setDevices([]); addFeed('info', 'Disconnected');
  };

  const sendClip = async () => {
    const t = await Clipboard.getStringAsync();
    if (!t) { addFeed('info', 'Your clipboard is empty.'); return; }
    if (ws.current?.readyState !== 1) return;
    last.current = t;
    const id = newId(); seen.current.add(id);
    ws.current.send(JSON.stringify({ type: 'clip', text: t, id }));
    addFeed('out', t);
  };

  useEffect(() => {
    if (!connected) return;
    const id = setInterval(() => {
      const sk = ws.current;
      if (!sk || sk.readyState !== 1) return;
      if (Date.now() - lastPong.current > 40000) { sk.close(); return; }
      sk.send(JSON.stringify({ type: 'ping' }));
    }, 15000);
    return () => clearInterval(id);
  }, [connected]);

  useEffect(() => {
    if (connected) activateKeepAwakeAsync(); else deactivateKeepAwake();
    return () => { deactivateKeepAwake(); };
  }, [connected]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', st => {
      if (st === 'active' && wantOn.current && ws.current?.readyState !== 1) connect();
    });
    return () => sub.remove();
  }, [host, pin, name]);

  useEffect(() => {
    if (!connected) return;
    const id = setInterval(async () => {
      const t = await Clipboard.getStringAsync();
      if (t && t !== last.current && ws.current?.readyState === 1) {
        last.current = t;
        const mid = newId(); seen.current.add(mid);
        ws.current.send(JSON.stringify({ type: 'clip', text: t, id: mid }));
        addFeed('out', t);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [connected]);

  const top = (Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 48) + 14;
  const statusText = connected ? 'Connected' : connecting ? 'Connecting' : 'Offline';
  const statusColor = connected ? c.ok : connecting ? '#E0A030' : c.muted;

  const renderItem = ({ item }) => item.kind === 'info' ? (
    <Text style={s.info}>{item.t} · {item.text}</Text>
  ) : (
    <TouchableOpacity style={s.row} activeOpacity={0.6}
      onPress={() => { last.current = item.text; Clipboard.setStringAsync(item.text); }}>
      <View style={[s.arrow, { backgroundColor: item.kind === 'in' ? c.ok : c.accent }]}>
        <Text style={s.arrowT}>{item.kind === 'in' ? '↓' : '↑'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text numberOfLines={2} style={s.rowT}>{item.text}</Text>
        <Text style={s.rowS}>{item.kind === 'in' ? 'Received' : 'Sent'} · {item.t} · tap to copy</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[s.wrap, { paddingTop: top }]}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <View style={s.header}>
        <Logo />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.title}>Copy<Text style={{ color: c.accent }}>Me</Text></Text>
          <Text style={s.tag}>Copy here. Paste there.</Text>
        </View>
        <View style={s.pill}>
          <View style={[s.dot, { backgroundColor: statusColor }]} />
          <Text style={s.pillT}>{statusText}</Text>
        </View>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }}>
        {!connected ? (
          <View style={s.card}>
            <Text style={s.cardT}>Connect to a host</Text>
            <Text style={s.cardS}>Open Copy Me on your computer and enter the address and PIN it shows.</Text>
            <Field s={s} c={c} label="DEVICE NAME" placeholder="My phone" value={name} onChangeText={setName} />
            <Field s={s} c={c} label="HOST ADDRESS" placeholder="192.168.1.20:8787" autoCapitalize="none" autoCorrect={false} value={host} onChangeText={setHost} />
            <Field s={s} c={c} label="PIN" placeholder="4-digit PIN" keyboardType="number-pad" value={pin} onChangeText={setPin} />
            <TouchableOpacity style={[s.btn, connecting && { opacity: 0.6 }]} disabled={connecting} onPress={connect}>
              <Text style={s.btnT}>{connecting ? 'Connecting…' : 'Connect'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.card}>
            <Text style={s.cardT}>Connected devices</Text>
            <View style={s.chips}>
              {devices.map((d, i) => (
                <View key={i} style={s.chip}>
                  <View style={s.avatar}><Text style={s.avatarT}>{(d || '?').slice(0, 1).toUpperCase()}</Text></View>
                  <Text style={s.chipT} numberOfLines={1}>{d}</Text>
                </View>
              ))}
            </View>
            <View style={{ flexDirection: 'row', marginTop: 16 }}>
              <TouchableOpacity style={[s.btn, { flex: 1, marginRight: 8 }]} onPress={sendClip}>
                <Text style={s.btnT}>Send clipboard now</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.btnGhost} onPress={disconnect}>
                <Text style={s.btnGhostT}>Disconnect</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <Text style={s.section}>ACTIVITY</Text>
        <View style={s.card}>
          {feed.length === 0 ? (
            <Text style={s.empty}>Nothing yet. Copy something on any connected device and it will show up here.</Text>
          ) : (
            <FlatList data={feed} keyExtractor={i => i.id} renderItem={renderItem} scrollEnabled={false} />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const makeStyles = c => StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: 18, paddingBottom: 28, backgroundColor: c.bg },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  title: { fontSize: 28, fontWeight: '800', color: c.text, letterSpacing: -0.5 },
  tag: { fontSize: 13, color: c.muted, marginTop: 1 },
  pill: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, borderColor: c.line, borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  pillT: { fontSize: 12, fontWeight: '600', color: c.text },
  card: { backgroundColor: c.card, borderColor: c.line, borderWidth: 1, borderRadius: 18, padding: 18, marginBottom: 14 },
  cardT: { fontSize: 17, fontWeight: '700', color: c.text },
  cardS: { fontSize: 13, color: c.muted, marginTop: 4, marginBottom: 16, lineHeight: 18 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: c.muted, marginBottom: 6 },
  input: { backgroundColor: c.input, color: c.text, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, borderWidth: 1, borderColor: c.line },
  btn: { backgroundColor: c.accent, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnT: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnGhost: { borderRadius: 12, borderWidth: 1, borderColor: c.line, paddingHorizontal: 16, justifyContent: 'center' },
  btnGhostT: { color: c.text, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.input, borderRadius: 20, paddingVertical: 5, paddingLeft: 5, paddingRight: 12, marginRight: 8, marginBottom: 8, maxWidth: '100%' },
  avatar: { width: 26, height: 26, borderRadius: 13, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  avatarT: { color: '#fff', fontWeight: '700', fontSize: 12 },
  chipT: { color: c.text, fontSize: 14, fontWeight: '500', flexShrink: 1 },
  section: { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: c.muted, marginBottom: 8, marginLeft: 4 },
  empty: { color: c.muted, fontSize: 14, lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.line },
  arrow: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  arrowT: { color: '#fff', fontWeight: '800', fontSize: 15 },
  rowT: { color: c.text, fontSize: 15 },
  rowS: { color: c.muted, fontSize: 12, marginTop: 2 },
  info: { color: c.muted, fontSize: 12, paddingVertical: 6 },
});
